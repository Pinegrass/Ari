# Sprint 3 — "Feel the Speed" Dev Instructions

**Objective:** The fastest, friendliest tracker in India — bill reminders live, onboarding shows value in <60s, polish everywhere. All OTA-shippable.
**Parent plan:** `docs/product-excellence-plan-2026-07.md` (§3, Sprint 3).
**Prerequisite state (verified 2026-07-04):** Sprint 0 closed — frontend master `8e0d447` pushed, backend `331dcdf` deployed to Railway prod, Sprint 0 OTA live at 20% staged rollout (update group `47f8ed5c-0eb1-4a37-95f5-c69bbeb22ec9`, preview branch).

---

## Repo rules (unchanged, load-bearing)

1. Frontend: `C:\Users\Augustus Rex\Projects\Workex\Ari`, branch **master**. Never touch `origin/main` (unrelated junk history).
2. Backend at `Ari/backend/` is a **separate repo** that auto-deploys to Railway prod on push. Blanket push authorization was granted 2026-07-04, but always: pre-flight with `railway variables --json` if config-sensitive, push, then verify `/api/health` and the changed behavior live. Backend is a bare gitlink (no `.gitmodules`) — advance the pointer with plain `git add backend`, and only **after** the backend commit is pushed.
3. **OTA constraint for this entire sprint: no new native dependencies.** JS-only packages are fine. If a task needs a native module, defer that piece to Sprint 4 (v1.1.0 native) and note it in the final report.
4. Gates: `npm test` (261+ tests), `npm run typecheck`, `npm run lint`. Coverage floor 46/52/37/47 (statements/branches/functions/lines) — raise if actuals grow, never lower.

## Sprint-scope correction (verified against code 2026-07-04)

**B2 "edit transaction" from the plan is ALREADY SHIPPED** — `PUT /transactions/:id` exists (`backend/routes/transactions.py:219`), `updateTransaction` exists in `src/api/transactions.ts` + `src/context/DataContext.tsx` (with silent-failure tests from Sprint 0), `AddTransactionScreen` has full edit mode, and Dashboard + Transactions rows navigate with `editTransaction`. Do NOT rebuild it. Its remaining slice moved into Task 4 (backend tests) and Task 6 (QA sweep). `docs/sprint-2-backlog.md` item #1 is stale — mark it done there.

---

## Task 1 (D1) — Bill / due-date reminders

The gap study's #1 value-per-effort item: rent, EMI, credit-card bill reminders.

- **Prefer reuse over new infra.** `TodoNote` already has `due_date`, `due_time`, `priority`; `expo-notifications` scheduling lives in `src/hooks/useNotifications.ts`. Recurring transactions + `src/lib/recurringEngine.ts` already model repetition.
- MVP: a "Bills & reminders" flow where the user creates a bill (name, amount, due day, repeat monthly y/n) → schedules **local** notifications (no backend cron) firing the day before + day of, deep-linking into fast entry with prefill.
- Surface upcoming bills as a Dashboard card (next 7 days).
- Rescheduling must survive app restarts (reconcile scheduled notifications on launch — cancel/reschedule idempotently).
- Tests: reminder-scheduling logic extracted into a pure `src/lib/` module with unit tests (date math: month ends, Feb, IST).

## Task 2 (D4) — Onboarding revamp: value in <60 seconds

- Current: `OnboardingScreen` (gradients already removed in Sprint 0). Rework the flow to be value-first and skippable: max 3 steps, each skippable, ending in the fast-entry keypad — the user should be able to log their first expense within 60s of first launch.
- Show, don't ask: prefer a pre-populated demo dashboard glimpse or inline examples over questionnaire screens. Keep whatever profiling questions exist (age group / income / goal) optional and deferrable to Settings.
- Instrument it: fire analytics events for each step (started/skipped/completed, time-to-first-transaction) via `src/lib/analytics.ts` so we can measure the funnel once the PostHog key lands.
- Do not redesign the design system — reuse `src/constants/colors.ts` and existing components.

## Task 3 (C3 + C6) — Perceived-performance and consistency polish

- Skeleton loaders (shimmer or simple pulse; JS-only) replacing spinners on Dashboard and Trends first paint; audit every list screen for a designed `EmptyState` (component exists) instead of blank space.
- Haptics sweep: every tap/success/destructive action uses `useHaptics` consistently (light/medium/success/warning/error per CLAUDE.md convention).
- AnimatedEntry staggering on any list/card screen missing it.
- Keep it surgical — no refactors; this task is diffs a designer would notice, not architecture.

## Task 4 (B4) — Backend pytest for every money-touching route

- Extend the Sprint 0 pytest setup (10 tests exist, `backend/tests/`) to cover: transactions CRUD **including `PUT /transactions/:id`** (ownership 404, validation caps, month recompute on date change), budgets CRUD (unique user+category+month upsert), savings-goals contribute (balance math), summary/pnl aggregation happy paths.
- Every route test asserts: auth required (401 without token), ownership isolation (user A cannot touch user B's row), validation rejects garbage.
- Target: transactions + budgets + goals routes each have their file; suite stays fast (SQLite in-memory, no network).

## Task 5 (C4) — Theme toggle (timeboxed groundwork)

- **Reality check first:** there is no ThemeProvider — `src/constants/colors.ts` is static constants imported everywhere. A true light/dark toggle is a tokenization refactor, not a switch.
- Timebox: introduce a minimal `ThemeContext` + `useColors()` hook returning the palette, migrate the **5 tab screens only** as proof, persist choice (system/dark/light) in AsyncStorage, expose the toggle in Settings behind the groundwork. If the shipped design turns out to be single-palette-only after migration, ship the Settings row as "coming soon" disabled state instead — do not half-ship a broken light mode.
- Report honestly which screens are migrated; full migration is a Sprint 4+ line item.

## Task 6 — QA + release procedure

1. Full gates: `npm test`, typecheck, lint, backend `pytest -q`. Ratchet coverage if actuals grew.
2. Manual/e2e sweep of the money paths: add, **edit** (row tap → change amount → save), delete, offline add→sync. If Maestro is set up by then, script it; otherwise document manual results.
3. Backend deploy (if backend changed): commit → push → watch Railway → verify `/api/health` + one changed behavior live.
4. **OTA publish — read carefully, this has burned us before:**
   - First check the Sprint 0 rollout: if the 20% staged rollout (group `47f8ed5c-...`) hasn't been promoted to 100%, report to founder before stacking a new update.
   - The live fleet runs runtimeVersion **"1.0.1"** (appVersion policy) but `app.json` now says fingerprint/1.0.2. Procedure: temporarily pin `expo.runtimeVersion` to the string `"1.0.1"` in the working tree only → `npx eas update --branch preview --message "sprint-3: <summary>"` → `git checkout -- app.json` to restore. A plain publish from repo state targets a fingerprint rtv that ZERO live users match.
   - Publish at a staged rollout (20%) unless founder says otherwise; note the update-group id in the final report.
5. Final report: what shipped, funnel events added, rollout state, founder to-dos (promote rollout %, PostHog key if still unset).

---

## Suggested order

Task 4 (backend tests — locks the floor) → Task 1 (bill reminders — biggest user win) → Task 2 (onboarding) → Task 3 (polish) → Task 5 (theme groundwork, timeboxed last) → Task 6 (QA + release).

## Definition of done

- [ ] Bill reminders: create/edit/delete, local notifications fire, Dashboard card, unit-tested date math.
- [ ] Onboarding: ≤3 skippable steps, ends in fast entry, funnel instrumented.
- [ ] Skeletons on Dashboard/Trends; EmptyState + haptics audit complete.
- [ ] Backend: transactions (incl. PUT) / budgets / goals routes fully tested; deployed + verified live.
- [ ] Theme: ThemeContext groundwork per timebox, honest status reported.
- [ ] All gates green on both repos; coverage ratcheted if grown; sprint-2-backlog.md item #1 marked shipped.
- [ ] OTA published per the runtimeVersion procedure (or explicitly deferred), rollout state reported.
