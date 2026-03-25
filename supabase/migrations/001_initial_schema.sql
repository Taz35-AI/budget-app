-- ═══════════════════════════════════════════════════════════════
-- BudgetTool — Initial Schema
-- ═══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────
-- 1. Core Tables
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS transactions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL,
  name         TEXT NOT NULL,
  amount       NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  category     TEXT NOT NULL CHECK (category IN ('income', 'expense')),
  type         TEXT NOT NULL CHECK (type IN ('recurring', 'one_off')),

  -- One-off
  date         DATE,

  -- Recurring
  start_date   DATE,
  end_date     DATE,
  frequency    TEXT CHECK (frequency IN (
                 'daily','weekly','biweekly',
                 'monthly','quarterly','semiannual','annual'
               )),

  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS transaction_exceptions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id   UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  effective_from   DATE NOT NULL,
  name             TEXT,
  amount           NUMERIC(12, 2) CHECK (amount > 0),
  end_date         DATE,
  is_deleted       BOOLEAN NOT NULL DEFAULT false,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (transaction_id, effective_from)
);

CREATE TABLE IF NOT EXISTS balance_resets (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL,
  reset_date   DATE NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────
-- 2. Cache Tables
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS daily_balance_cache (
  user_id      UUID NOT NULL,
  date         DATE NOT NULL,
  balance      NUMERIC(12, 2) NOT NULL,
  computed_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY  (user_id, date)
);

CREATE TABLE IF NOT EXISTS balance_cache_status (
  user_id        UUID PRIMARY KEY,
  dirty_from     DATE,
  is_computing   BOOLEAN NOT NULL DEFAULT false,
  last_computed  TIMESTAMPTZ,
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────
-- 3. Indexes
-- ─────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_tx_user_date
  ON transactions(user_id, date);

CREATE INDEX IF NOT EXISTS idx_tx_user_start
  ON transactions(user_id, start_date);

CREATE INDEX IF NOT EXISTS idx_tx_user_type
  ON transactions(user_id, type);

CREATE INDEX IF NOT EXISTS idx_exc_tx_id
  ON transaction_exceptions(transaction_id);

CREATE INDEX IF NOT EXISTS idx_exc_effective_from
  ON transaction_exceptions(transaction_id, effective_from DESC);

CREATE INDEX IF NOT EXISTS idx_cache_user_date
  ON daily_balance_cache(user_id, date);

CREATE INDEX IF NOT EXISTS idx_resets_user
  ON balance_resets(user_id, reset_date DESC);

-- ─────────────────────────────────────────────────────────────
-- 4. updated_at trigger
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_transactions_updated_at
BEFORE UPDATE ON transactions
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- 5. Cache invalidation trigger
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION mark_balance_cache_dirty()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_user_id     UUID;
  affected_from DATE;
BEGIN
  v_user_id := COALESCE(NEW.user_id, OLD.user_id);
  affected_from := COALESCE(
    NEW.date, NEW.start_date,
    OLD.date, OLD.start_date,
    CURRENT_DATE
  );

  INSERT INTO balance_cache_status (user_id, dirty_from, updated_at)
  VALUES (v_user_id, affected_from, now())
  ON CONFLICT (user_id) DO UPDATE
    SET dirty_from = LEAST(balance_cache_status.dirty_from, EXCLUDED.dirty_from),
        updated_at = now();

  -- Delete stale cache rows from the affected date forward
  DELETE FROM daily_balance_cache
  WHERE user_id = v_user_id AND date >= affected_from;

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_transactions_dirty
AFTER INSERT OR UPDATE OR DELETE ON transactions
FOR EACH ROW EXECUTE FUNCTION mark_balance_cache_dirty();

-- ─────────────────────────────────────────────────────────────
-- 6. Row Level Security
-- ─────────────────────────────────────────────────────────────

ALTER TABLE transactions            ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_exceptions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE balance_resets          ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_balance_cache     ENABLE ROW LEVEL SECURITY;
ALTER TABLE balance_cache_status    ENABLE ROW LEVEL SECURITY;

-- Transactions: user owns their own rows
CREATE POLICY "users_own_transactions" ON transactions
  FOR ALL USING (user_id = auth.uid());

-- Exceptions inherit from transaction ownership
CREATE POLICY "users_own_exceptions" ON transaction_exceptions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM transactions t
      WHERE t.id = transaction_exceptions.transaction_id
        AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "users_own_resets" ON balance_resets
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "users_own_cache" ON daily_balance_cache
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "users_own_cache_status" ON balance_cache_status
  FOR ALL USING (user_id = auth.uid());

-- ─────────────────────────────────────────────────────────────
-- 7. Seed data (dummy user for development)
-- ─────────────────────────────────────────────────────────────

INSERT INTO transactions (id, user_id, name, amount, category, type, start_date, frequency)
VALUES
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'Monthly Salary',   3200, 'income',  'recurring', CURRENT_DATE - INTERVAL '60 days', 'monthly'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'Rent',             1200, 'expense', 'recurring', CURRENT_DATE - INTERVAL '60 days', 'monthly'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'Groceries',         80,  'expense', 'recurring', CURRENT_DATE - INTERVAL '30 days', 'weekly'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'Streaming Services',15,  'expense', 'recurring', CURRENT_DATE - INTERVAL '90 days', 'monthly'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'Gym Membership',    45,  'expense', 'recurring', CURRENT_DATE - INTERVAL '30 days', 'monthly'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'Freelance Payment', 500, 'income',  'one_off',   NULL, NULL)
ON CONFLICT DO NOTHING;

-- Fix the one-off date
UPDATE transactions
SET date = CURRENT_DATE + INTERVAL '5 days'
WHERE name = 'Freelance Payment'
  AND user_id = '00000000-0000-0000-0000-000000000001'
  AND date IS NULL;
