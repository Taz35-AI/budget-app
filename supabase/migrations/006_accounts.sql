-- ═══════════════════════════════════════════════════════════════
-- BudgetTool — Multi-Account Support
-- Run this in the Supabase SQL Editor.
-- ═══════════════════════════════════════════════════════════════

-- 1. Create budget_accounts table
CREATE TABLE IF NOT EXISTS budget_accounts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL,
  name        text NOT NULL DEFAULT 'Main Account',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS budget_accounts_user_id_idx ON budget_accounts(user_id);

-- RLS
ALTER TABLE budget_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_accounts" ON budget_accounts
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 2. Add account_id to transactions (CASCADE: deleting an account deletes its transactions)
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES budget_accounts(id) ON DELETE CASCADE;

-- 3. Add account_id to balance_resets (CASCADE: deleting an account deletes its resets)
ALTER TABLE balance_resets
  ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES budget_accounts(id) ON DELETE CASCADE;

-- Indexes
CREATE INDEX IF NOT EXISTS transactions_account_id_idx    ON transactions(account_id);
CREATE INDEX IF NOT EXISTS balance_resets_account_id_idx  ON balance_resets(account_id);

-- 4. Seed default accounts for every existing user that has transactions
INSERT INTO budget_accounts (user_id, name)
SELECT DISTINCT user_id, 'Main Account'
FROM transactions
WHERE user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM budget_accounts a WHERE a.user_id = transactions.user_id
  );

-- 5. Backfill: assign all existing transactions to their user's default account
UPDATE transactions t
SET account_id = (
  SELECT a.id
  FROM   budget_accounts a
  WHERE  a.user_id = t.user_id
  ORDER  BY a.created_at
  LIMIT  1
)
WHERE t.account_id IS NULL
  AND t.user_id IS NOT NULL;

-- 6. Backfill: assign all existing balance_resets to their user's default account
UPDATE balance_resets r
SET account_id = (
  SELECT a.id
  FROM   budget_accounts a
  WHERE  a.user_id = r.user_id
  ORDER  BY a.created_at
  LIMIT  1
)
WHERE r.account_id IS NULL
  AND r.user_id IS NOT NULL;
