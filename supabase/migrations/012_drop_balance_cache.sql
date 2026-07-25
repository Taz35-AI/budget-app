-- The server-side daily balance cache was never invalidated when transactions
-- changed, and no client code reads it any more (balances are computed
-- client-side by the pure engine). The /api/balances route has been removed;
-- drop the now-unused tables.
--
-- ORDER MATTERS. 001_initial_schema.sql installs a trigger on `transactions`
-- (trg_transactions_dirty -> mark_balance_cache_dirty) that writes to these
-- tables on every INSERT/UPDATE/DELETE. Dropping the tables while that trigger
-- still exists makes EVERY write to `transactions` fail with:
--
--   relation "balance_cache_status" does not exist
--
-- so the trigger and its function must go first.

DROP TRIGGER IF EXISTS trg_transactions_dirty ON transactions;
DROP FUNCTION IF EXISTS mark_balance_cache_dirty();

DROP TABLE IF EXISTS daily_balance_cache;
DROP TABLE IF EXISTS balance_cache_status;
