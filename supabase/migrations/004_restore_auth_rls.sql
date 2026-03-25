-- ═══════════════════════════════════════════════════════════════
-- BudgetTool — Restore proper auth-based RLS
-- Run this after implementing auth to restore per-user data isolation.
-- ═══════════════════════════════════════════════════════════════

-- Drop the open dev policies
DROP POLICY IF EXISTS "dev_allow_all" ON transactions;
DROP POLICY IF EXISTS "dev_allow_all" ON transaction_exceptions;
DROP POLICY IF EXISTS "dev_allow_all" ON balance_resets;
DROP POLICY IF EXISTS "dev_allow_all" ON daily_balance_cache;
DROP POLICY IF EXISTS "dev_allow_all" ON balance_cache_status;

-- Restore auth.uid()-based policies
CREATE POLICY "users_own_transactions" ON transactions
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_own_exceptions" ON transaction_exceptions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM transactions t
      WHERE t.id = transaction_exceptions.transaction_id
        AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "users_own_resets" ON balance_resets
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_own_cache" ON daily_balance_cache
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_own_cache_status" ON balance_cache_status
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
