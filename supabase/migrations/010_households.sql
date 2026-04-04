-- ═══════════════════════════════════════════════════════════════
-- BudgetTool — Household Sharing v4
-- Standard org/workspace model. One user = one household.
-- PK constraint prevents race conditions.
-- Run each SECTION separately in the Supabase SQL Editor.
-- ═══════════════════════════════════════════════════════════════


-- ── SECTION 1: Tables ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS households (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL DEFAULT 'My Household',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE households ENABLE ROW LEVEL SECURITY;

-- user_id is PRIMARY KEY: a user can only be in ONE household.
-- This makes race conditions impossible at the database level.
CREATE TABLE IF NOT EXISTS household_members (
  user_id      uuid PRIMARY KEY,
  household_id uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  role         text NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'member')),
  display_name text,
  joined_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_hm_household ON household_members(household_id);
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS household_invites (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id  uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  invited_by    uuid NOT NULL,
  invited_email text NOT NULL,
  token         text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  status        text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'revoked')),
  display_name  text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  expires_at    timestamptz NOT NULL DEFAULT now() + interval '7 days'
);
CREATE INDEX IF NOT EXISTS idx_hi_token ON household_invites(token);
CREATE INDEX IF NOT EXISTS idx_hi_email ON household_invites(invited_email);
ALTER TABLE household_invites ENABLE ROW LEVEL SECURITY;


-- ── SECTION 2: Columns on existing tables ────────────────────

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS household_id uuid REFERENCES households(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS created_by   uuid;

ALTER TABLE budget_accounts
  ADD COLUMN IF NOT EXISTS household_id uuid REFERENCES households(id) ON DELETE CASCADE;

ALTER TABLE balance_resets
  ADD COLUMN IF NOT EXISTS household_id uuid REFERENCES households(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_tx_household    ON transactions(household_id);
CREATE INDEX IF NOT EXISTS idx_acct_household  ON budget_accounts(household_id);
CREATE INDEX IF NOT EXISTS idx_reset_household ON balance_resets(household_id);


-- ── SECTION 3: ensure_household() — race-condition-proof ─────

CREATE OR REPLACE FUNCTION ensure_household(p_user_id uuid, p_name text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql AS $$
DECLARE
  v_hid uuid;
BEGIN
  -- Fast path: user already in a household
  SELECT household_id INTO v_hid FROM household_members WHERE user_id = p_user_id;
  IF v_hid IS NOT NULL THEN RETURN v_hid; END IF;

  -- Create household + membership in one transaction.
  -- PK on user_id means only one concurrent call can succeed.
  INSERT INTO households (name) VALUES (COALESCE(p_name, 'My Household')) RETURNING id INTO v_hid;
  INSERT INTO household_members (user_id, household_id, role, display_name)
  VALUES (p_user_id, v_hid, 'owner', NULL)
  ON CONFLICT (user_id) DO NOTHING;

  -- If ON CONFLICT fired, another call won the race. Read their result.
  IF NOT FOUND THEN
    SELECT household_id INTO v_hid FROM household_members WHERE user_id = p_user_id;
  END IF;

  RETURN v_hid;
END;
$$;


-- ── SECTION 4: Backfill existing data ────────────────────────

DO $$
DECLARE
  r RECORD;
  hid uuid;
BEGIN
  FOR r IN (
    SELECT DISTINCT user_id FROM budget_accounts
    WHERE user_id IS NOT NULL
    UNION
    SELECT DISTINCT user_id FROM transactions
    WHERE user_id IS NOT NULL
  ) LOOP
    -- Skip if already migrated
    IF EXISTS (SELECT 1 FROM household_members WHERE user_id = r.user_id) THEN
      SELECT household_id INTO hid FROM household_members WHERE user_id = r.user_id;
    ELSE
      hid := ensure_household(r.user_id);
    END IF;

    UPDATE transactions
      SET household_id = hid, created_by = COALESCE(created_by, user_id)
      WHERE user_id = r.user_id AND household_id IS NULL;

    UPDATE budget_accounts
      SET household_id = hid
      WHERE user_id = r.user_id AND household_id IS NULL;

    UPDATE balance_resets
      SET household_id = hid
      WHERE user_id = r.user_id AND household_id IS NULL;
  END LOOP;
END;
$$;


-- ── SECTION 5: RLS policies ─────────────────────────────────

-- households
DROP POLICY IF EXISTS "hh_select" ON households;
CREATE POLICY "hh_select" ON households
  FOR SELECT USING (
    id = (SELECT household_id FROM household_members WHERE user_id = auth.uid())
  );

-- household_members
DROP POLICY IF EXISTS "hu_select" ON household_members;
CREATE POLICY "hm_select" ON household_members
  FOR SELECT USING (
    household_id = (SELECT household_id FROM household_members WHERE user_id = auth.uid())
  );

-- household_invites
DROP POLICY IF EXISTS "hi_select" ON household_invites;
CREATE POLICY "hi_select" ON household_invites
  FOR SELECT USING (
    household_id = (SELECT household_id FROM household_members WHERE user_id = auth.uid())
    OR invited_by = auth.uid()
    OR invited_email = lower((SELECT email FROM auth.users WHERE id = auth.uid()))
  );

-- budget_accounts
DROP POLICY IF EXISTS "users_own_accounts" ON budget_accounts;
DROP POLICY IF EXISTS "accounts_select" ON budget_accounts;
DROP POLICY IF EXISTS "accounts_insert" ON budget_accounts;
DROP POLICY IF EXISTS "accounts_update" ON budget_accounts;
DROP POLICY IF EXISTS "accounts_delete" ON budget_accounts;
CREATE POLICY "acct_all" ON budget_accounts
  FOR ALL USING (
    household_id = (SELECT household_id FROM household_members WHERE user_id = auth.uid())
  );

-- transactions
DROP POLICY IF EXISTS "users_own_transactions" ON transactions;
DROP POLICY IF EXISTS "tx_select" ON transactions;
DROP POLICY IF EXISTS "tx_insert" ON transactions;
DROP POLICY IF EXISTS "tx_update" ON transactions;
DROP POLICY IF EXISTS "tx_delete" ON transactions;
CREATE POLICY "tx_all" ON transactions
  FOR ALL USING (
    household_id = (SELECT household_id FROM household_members WHERE user_id = auth.uid())
  );

-- transaction_exceptions
DROP POLICY IF EXISTS "users_own_exceptions" ON transaction_exceptions;
DROP POLICY IF EXISTS "exc_access" ON transaction_exceptions;
CREATE POLICY "exc_all" ON transaction_exceptions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM transactions t
      WHERE t.id = transaction_exceptions.transaction_id
        AND t.household_id = (SELECT household_id FROM household_members WHERE user_id = auth.uid())
    )
  );

-- balance_resets
DROP POLICY IF EXISTS "users_own_resets" ON balance_resets;
DROP POLICY IF EXISTS "resets_select" ON balance_resets;
DROP POLICY IF EXISTS "resets_insert" ON balance_resets;
DROP POLICY IF EXISTS "resets_update" ON balance_resets;
DROP POLICY IF EXISTS "resets_delete" ON balance_resets;
CREATE POLICY "reset_all" ON balance_resets
  FOR ALL USING (
    household_id = (SELECT household_id FROM household_members WHERE user_id = auth.uid())
  );

-- daily_balance_cache + balance_cache_status keep user_id policies
-- (API uses admin client for cache, these are performance tables)
