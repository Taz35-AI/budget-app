-- HOTFIX for databases where 012 was applied in its original form.
--
-- 012 originally dropped daily_balance_cache and balance_cache_status without
-- first removing the trigger that writes to them. That trigger fires on every
-- INSERT/UPDATE/DELETE on `transactions`, so afterwards no transaction could be
-- created, edited or deleted — the write failed with:
--
--   relation "balance_cache_status" does not exist
--
-- Safe to run more than once, and safe on databases where 012 was never applied
-- (the tables are gone either way, so the trigger has nothing to write to).

DROP TRIGGER IF EXISTS trg_transactions_dirty ON transactions;
DROP FUNCTION IF EXISTS mark_balance_cache_dirty();

-- Ensure the tables really are gone, in case 012 half-applied.
DROP TABLE IF EXISTS daily_balance_cache;
DROP TABLE IF EXISTS balance_cache_status;
