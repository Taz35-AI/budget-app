-- ═══════════════════════════════════════════════════════════════
-- BudgetTool — Account Type & Credit Limit
-- Run this in the Supabase SQL Editor.
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE budget_accounts
  ADD COLUMN IF NOT EXISTS type         text    NOT NULL DEFAULT 'checking',
  ADD COLUMN IF NOT EXISTS credit_limit numeric;
