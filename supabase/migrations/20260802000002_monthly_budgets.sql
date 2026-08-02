-- monthly_budgets — overall (category-agnostic) monthly spending cap per user.
-- One row per user+month; set/cleared via GET/PUT /api/budgets/overall.
CREATE TABLE monthly_budgets (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES ari_users(id) ON DELETE CASCADE,
  month        DATE NOT NULL,
  total_limit  NUMERIC(12,2) NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, month)
);

CREATE INDEX monthly_budgets_user_id_month_idx ON monthly_budgets (user_id, month);

ALTER TABLE monthly_budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY select_own_monthly_budgets ON monthly_budgets
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY insert_own_monthly_budgets ON monthly_budgets
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY update_own_monthly_budgets ON monthly_budgets
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY delete_own_monthly_budgets ON monthly_budgets
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER monthly_budgets_touch_updated_at
  BEFORE UPDATE ON monthly_budgets
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
