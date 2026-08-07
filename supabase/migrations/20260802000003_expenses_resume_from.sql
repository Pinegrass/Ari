-- expenses.resume_from — skip-on-resume for recurring templates.
-- Stamped by the client when a paused template resumes; the recurringEngine
-- skips due dates before this day so the pause window is never backfilled.

ALTER TABLE expenses
  ADD COLUMN IF NOT EXISTS resume_from DATE;
