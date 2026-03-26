-- ═══════════════════════════════════════════════════════════════
-- BudgetTool — User Settings (Supabase-persisted)
-- Replaces localStorage as the source of truth for settings so
-- they roam across devices.
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS user_settings (
  user_id    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  settings   JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_settings" ON user_settings
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Auto-update updated_at on change
CREATE OR REPLACE FUNCTION update_user_settings_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_user_settings_updated_at();
