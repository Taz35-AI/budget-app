-- ═══════════════════════════════════════════════════════════════
-- BudgetTool — Dev RLS (pre-auth phase)
--
-- Run this in Supabase SQL Editor while auth is not yet implemented.
-- It replaces auth.uid()-based policies with open policies that allow
-- the anon key to read and write. When real auth is added, these
-- policies will be replaced with per-user policies.
-- ═══════════════════════════════════════════════════════════════

-- Drop the auth-gated policies
DROP POLICY IF EXISTS "users_own_transactions"       ON transactions;
DROP POLICY IF EXISTS "users_own_exceptions"         ON transaction_exceptions;
DROP POLICY IF EXISTS "users_own_resets"             ON balance_resets;
DROP POLICY IF EXISTS "users_own_cache"              ON daily_balance_cache;
DROP POLICY IF EXISTS "users_own_cache_status"       ON balance_cache_status;

-- Open policies: allow all operations via anon key
-- (Safe for dev — tighten to auth.uid() when you add auth)
CREATE POLICY "dev_allow_all" ON transactions            FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "dev_allow_all" ON transaction_exceptions  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "dev_allow_all" ON balance_resets          FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "dev_allow_all" ON daily_balance_cache     FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "dev_allow_all" ON balance_cache_status    FOR ALL USING (true) WITH CHECK (true);
