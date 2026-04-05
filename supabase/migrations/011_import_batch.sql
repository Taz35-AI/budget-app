-- ═══════════════════════════════════════════════════════════════
-- BudgetTool — Import batch tracking
-- Tags every transaction inserted via the CSV import wizard with
-- a shared import_batch_id so the user can undo a bad import.
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS import_batch_id uuid;

CREATE INDEX IF NOT EXISTS idx_tx_import_batch ON transactions(import_batch_id)
  WHERE import_batch_id IS NOT NULL;
