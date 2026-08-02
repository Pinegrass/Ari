-- =============================================================================
-- Recurring payment management (Phase 1): pause flag on expenses.
--
-- A paused recurring TEMPLATE (is_recurring = TRUE, parent_recurring_id IS
-- NULL) stops generating future instances — the client-side recurringEngine
-- skips it in both generation and next-30-day projection. Past child
-- instances are untouched. server_default keeps existing rows FALSE.
-- =============================================================================

ALTER TABLE expenses
  ADD COLUMN is_paused BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN expenses.is_paused IS 'Paused recurring template: no new instances generated until resumed.';
