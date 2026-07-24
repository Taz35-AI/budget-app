-- The server-side daily balance cache was never invalidated when transactions
-- changed, and no client code reads it any more (balances are computed
-- client-side by the pure engine). The /api/balances route has been removed;
-- drop the now-unused tables.

DROP TABLE IF EXISTS daily_balance_cache;
DROP TABLE IF EXISTS balance_cache_status;
