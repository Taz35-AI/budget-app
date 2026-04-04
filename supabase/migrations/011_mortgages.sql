-- ═══════════════════════════════════════════════════════════════
-- BudgetTool — Mortgage tracking
-- Fixed-rate, fixed-term mortgages scoped per user within a household.
-- Each mortgage has an associated tag_id (a customTag in the user's
-- zustand settings) so the owner can tag payment transactions.
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS mortgages (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL,
  household_id  uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name          text NOT NULL,
  principal     numeric NOT NULL CHECK (principal > 0),
  interest_rate numeric NOT NULL CHECK (interest_rate >= 0 AND interest_rate < 1),
  term_months   integer NOT NULL CHECK (term_months > 0 AND term_months <= 600),
  start_date    date NOT NULL,
  tag_id        text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mortgages_household ON mortgages(household_id);
CREATE INDEX IF NOT EXISTS idx_mortgages_user ON mortgages(user_id);

ALTER TABLE mortgages ENABLE ROW LEVEL SECURITY;

-- Household members can see all mortgages in their household
DROP POLICY IF EXISTS "mtg_select" ON mortgages;
CREATE POLICY "mtg_select" ON mortgages
  FOR SELECT USING (
    household_id = (SELECT household_id FROM household_members WHERE user_id = auth.uid())
  );

-- Only the owner can insert/update/delete their own mortgage
DROP POLICY IF EXISTS "mtg_insert" ON mortgages;
CREATE POLICY "mtg_insert" ON mortgages
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND household_id = (SELECT household_id FROM household_members WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "mtg_update" ON mortgages;
CREATE POLICY "mtg_update" ON mortgages
  FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "mtg_delete" ON mortgages;
CREATE POLICY "mtg_delete" ON mortgages
  FOR DELETE USING (user_id = auth.uid());
