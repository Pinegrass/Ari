# Sprint 0 — "Close the Audit" Dev Instructions

**Objective:** Zero known medium+ security findings; no silent failures on the money write path; CI replaces checklist claims as the source of truth.
**Parent plan:** `docs/product-excellence-plan-2026-07.md` (§3, Sprint 0).
**Estimated scope:** 1 focused session. All items ship OTA/backend — no native build required.

---

## Read this first — repo rules

1. **Frontend** repo root: `C:\Users\Augustus Rex\Projects\Workex\Ari`, working branch **master**. `origin/main` is an unrelated junk history — never merge into or PR against it.
2. **Backend** is a **separate git repo** nested at `Ari/backend/` (github.com/ejjy/ari-backend, branch master). **It auto-deploys to Railway production on every push to master.** Therefore: **commit backend changes but DO NOT `git push` the backend** — the founder pushes after review.
3. Before starting: `git merge claude/mystifying-carson-afe757` into master (frontend). That branch contains: the tax-calculator test suite (100% coverage), the coverage-threshold ratchet, the worktree-safe jest `testPathIgnorePatterns` fix, and the planning docs including this file. It is a clean descendant of master.
4. Frontend tests: `npm test` (256+ tests must pass), `npm run typecheck`, `npm run lint`. Coverage gate: 42/50/36/43 (statements/branches/functions/lines) — do not lower; raise if actuals grow.

---

## Task 1 (A2) — SECRET_KEY fail-fast in production

**File:** `backend/config.py` (default `_SECRET_KEY_DEFAULT = "dev-secret-change-me"`).

- At app boot, if running in production (Railway sets `RAILWAY_ENVIRONMENT`; treat presence of `SUPABASE_DATABASE_URL`/`DATABASE_URL` as a production signal too) **and** `SECRET_KEY` equals the dev default → `raise RuntimeError` with a clear message. Local/SQLite dev keeps working without env setup.
- Add a pytest covering both paths (prod-like env + default key → boot fails; dev env → boots).

## Task 2 (A1) — Rate-limit auth endpoints

**Files:** `backend/routes/auth.py`, reuse the existing limiter pattern (see `backend/jobs/rate_limiter.py` and its usage in `routes/parse.py` / `routes/tomo.py`) or add Flask-Limiter.

- `/auth/login` and `/auth/register`: ~5/min per IP and ~20/hour per identifier (email). Return `429` with a JSON error body consistent with existing error responses.
- Known limitation to note in a comment: gunicorn runs 2 workers, so in-memory counters are per-worker (effective limit ≈ 2×). Acceptable for v1; Redis is the upgrade path.
- Tests: hammer login in a loop → expect 429; verify a successful login within limits still works.

## Task 3 (B1) — Fix `addTransaction` silent error swallow

**Files:** `src/context/DataContext.tsx` (and possibly `src/lib/syncEngine.ts` / `src/screens/AddTransactionScreen.tsx`).

- Known issue (Sprint 2 device QA): a failed `addTransaction` can swallow the error — user believes the expense was saved. Find the catch path.
- Required behavior: offline/queued saves are fine (that's the offline-first design), but a **genuine failure must surface** — error haptic + visible feedback (reuse `ErrorBanner` / existing toast pattern), and the entry must either land in the offline queue or the user must be told it didn't save. No path may drop data silently.
- Add a Jest regression test (mock a rejected API call; assert the error surfaces / queueing happens).

## Task 4 (B3 + A3) — CI on both repos

**Frontend** — `.github/workflows/ci.yml`:
- Trigger: push + PR on master.
- Steps: checkout → setup-node 20 → `npm ci` → `npm run typecheck` → `npm run lint` → `npx jest --coverage` (thresholds enforce automatically) → `npm audit --audit-level=high` (allowed to fail the job? start non-blocking: `continue-on-error: true`, tighten later).
- Add `.github/dependabot.yml` (npm, weekly).

**Backend** — same pattern in the backend repo: setup-python 3.12 → `pip install -r requirements.txt` → `pytest -q` → `pip-audit` (non-blocking initially). Add Dependabot for pip. Remember: commit, don't push.

## Task 5 (C1) — Remove gradients from OnboardingScreen

**File:** `src/screens/OnboardingScreen.tsx`.

- Replace `LinearGradient` usage with solid colors from `src/constants/colors.ts` — match the shipped design system exactly (check what the rest of the app actually uses today; do not invent a new palette). Remove the `expo-linear-gradient` import; if nothing else imports it, leave the package (removal = native-adjacent churn, not worth it this sprint).
- Verify: `npm run typecheck` + visually via `npm start` if a device/emulator is available; otherwise flag for manual QA.

## Task 6 (B7-partial) — Observability wiring

- PostHog: code path exists (`src/lib/analytics.ts`, no-op when `EXPO_PUBLIC_POSTHOG_KEY` unset). Confirm the wiring is event-complete for: transaction added, transaction failed-to-save (from Task 3), signup, login. **Setting the actual key is a founder/EAS-env action — flag it, don't fake it.**
- Sentry: confirm release + dist are set on init so release health works. Dashboard setup is a web-UI task — list it in the final report as a founder to-do.

---

## Definition of done

- [ ] All existing + new tests pass on both repos; frontend coverage gate holds (≥42/50/36/43).
- [ ] `npm run typecheck` and `npm run lint` clean.
- [ ] Backend: boot fails loudly with default SECRET_KEY in prod-like env; auth returns 429 under hammering.
- [ ] Frontend: no code path drops a transaction without user-visible feedback.
- [ ] CI workflows committed on both repos; Dependabot configs in place.
- [ ] OnboardingScreen has zero `LinearGradient` references.
- [ ] Backend changes **committed but not pushed**; frontend committed on master (or a branch off master).
- [ ] Final report lists founder to-dos: push backend, set `EXPO_PUBLIC_POSTHOG_KEY` in EAS env, Sentry dashboard setup, review + OTA publish decision.
