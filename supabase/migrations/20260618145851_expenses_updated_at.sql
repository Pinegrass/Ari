-- expenses.updated_at — Sprint 2 offline-sync (G1): server-authoritative
-- timestamp for last-write-wins reconciliation.
--
-- RECONSTRUCTED 2026-08-02: this migration was originally applied directly
-- via the Supabase dashboard on 2026-06-18 and the local file was never
-- committed, causing `supabase db push` to refuse with "remote migration
-- versions not found in local migrations directory". This file restores
-- local/remote history parity. It is already applied on the remote, so the
-- statements are written defensively (IF NOT EXISTS) — on a fresh local
-- stack they produce the same end state.

ALTER TABLE expenses
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Backfill pre-existing rows (no-op on the remote, already backfilled).
UPDATE expenses SET updated_at = created_at WHERE updated_at IS NULL;

-- Keep updated_at fresh on every update, same pattern as other tables.
DROP TRIGGER IF EXISTS expenses_touch_updated_at ON expenses;
CREATE TRIGGER expenses_touch_updated_at
  BEFORE UPDATE ON expenses
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
