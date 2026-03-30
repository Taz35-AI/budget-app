-- Add transfer_id to link the two sides of an account transfer.
-- When a transfer is created, both the expense (source) and income (destination)
-- transaction get the same transfer_id so they can be identified as a pair.
-- ON DELETE nothing is affected — deleting one side leaves the other intact;
-- the application handles paired deletion separately.

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS transfer_id UUID;

CREATE INDEX IF NOT EXISTS idx_transactions_transfer_id ON transactions(transfer_id);
