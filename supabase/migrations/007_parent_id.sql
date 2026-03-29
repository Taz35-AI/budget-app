-- Add parent_id to transactions to track series lineage.
-- When a recurring series is split (date change on all_future) or a one-off
-- is spawned from a recurring occurrence (date change on this_only), the new
-- transaction gets parent_id = root series id.
-- ON DELETE SET NULL: if the root is deleted some other way, children survive
-- with parent_id = null rather than being cascaded away.
-- The application-level "delete entire series" logic queries
--   id = root OR parent_id = root
-- and deletes everything at once, so CASCADE isn't needed here.

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES transactions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_parent_id ON transactions(parent_id);
