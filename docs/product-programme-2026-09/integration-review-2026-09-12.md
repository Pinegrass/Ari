# Integration review — 12 September 2026

Scope: mobile HEAD0bdef30 (implementation e9d1cb4), backend a4014a8, canonical nested web HEAD7d11e4f plus its current uncommitted product changes. No application code, deployment, provider permissions or user data changed during this review. Reviewed product API contracts, planning freshness, trials, reporting, notification outbox/receipts, measurement wiring and recent offline/auth fixes. This is a targeted review, not a claim of exhaustive security or native-device verification.

## Findings

### P1 — A dated obligation silently disappears from a still-valid plan

Location: backend/routes/product.py:45 and53.

The snapshot stays ready for24hours, but its obligation sum uses the current date as its lower bound. A plan confirmed before midnight can therefore drop an obligation as soon as its due date passes, although neither available cash nor whether that obligation was paid has been reconfirmed. Reopening the plan fetches a larger remainder from the live backend logic.

Reproduced directly against planning_response with an unchanged ledger revision and a snapshot age of one hour: cash1000, reserve100, obligation200 dueSeptember11, paydaySeptember15. With local dateSeptember11, ready/remaining700/obligations200/perDay175. With local dateSeptember12, ready/remaining900/obligations0/perDay300. Inputs and ledger stayed identical. This is a deterministic isolated function reproduction, not a production account test.

Fix: expire/reconfirm a snapshot when its local confirmation date changes, or retain obligations until explicitly reconciled against refreshed cash. Add a midnight/due-date regression covering GET as well as save.

### P1 — Web planning bypasses background and changed-ledger invalidation

Location: aritomo-web/lib/usePlanning.ts:9; aritomo-web/components/app/Planning.tsx:6; AppDashboard.tsx:213.

Keep the planning tab mounted, switch away from the browser, log an expense on mobile, then return. The dashboard focus handler refreshes general profile/ledger data, but not /planning. Planning only reloads on currency or explicit retry changes, and its invalidate callback is never connected to browser visibility. The old estimate remains visible until its24-hour timer expires despite the server being able to return entries_changed. The same omission lets an open plan survive its payday until24hours elapse. Mobile has a background invalidation listener; the web does not.

Evidence: static integration trace of the hook dependencies, the mounted Planning props, and dashboard wake API list. This scenario was not exercised in a browser during this review.

Fix: clear estimates on hidden/blur, revalidate on visible/focus and ledger changes; enforce account-local date/payday expiry. Add a component integration check for a cross-device entry followed by browser focus.

### P2 — Approved measurement events are not wired through the clients

Location: src/lib/analytics.ts:101; src/screens/PeriodicReportsScreen.tsx:102; both Planning and TrialCard components.

Mobile emits report_action_started from the report button, but track's mapping omits it, silently dropping the action. A transpiled-module probe with consent enabled and Private Mode off produced zero requests for report_action_started and one valid report_opened request for the control event. Web supports report_action_started, so platform comparisons undercount Android.

The backend also accepts planning_saved and trial_started, but neither platform emits them on successful planning saves or trial starts. Web's measurement event type excludes these events. Consequently those approved conversion counts remain empty even when operations succeed.

Fix: use a shared typed event contract, map the action event, and emit success events once after confirmed operations while retaining consent/privacy checks. Verify consent-off emits nothing and failed operations do not count.

## Verification performed now

- Backend:66 tests passed across product completion, reviews, notification policy, outbox and receipts.
- Mobile:27 tests passed across syncEngine and AuthContext hydration.
- Web:9 tests passed across its three existing suites.
- Deterministic isolated midnight-planning and analytics probes reproduced findings1and3.
- The passing suites do not cover the above integration scenarios. Prior516-test/native evidence remains historical; the full suite and phone checks were not repeated in this review.

## Existing release and operational gaps

Last verified release evidence still records Play internal submission permission failure, unavailable Play/RevenueCat catalog and incomplete BillDesk setup. Actual purchase/restore and actual push display/receipts remain unverified, with automatic outbox draining gated off. Web product changes remain uncommitted/undeployed; iPhone testing remains deferred by the owner. These statuses were read from the prior exact-artifact evidence, not rechecked against providers in this review.

Prioritise the two planning findings before broader rollout, then finish measurement wiring and the separately blocked operational validation.

## Resolution
All three findings were fixed locally in the subsequent implementation. See integration-fixes-2026-09-12.md for exact commits and automated verification. No on-device testing or deployment followed.
