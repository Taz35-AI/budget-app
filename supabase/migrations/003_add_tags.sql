-- Add optional tag column to transactions (Feature: transaction categories/tags)
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS tag TEXT;
