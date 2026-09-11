# Phase 3 — deferred review notifications

11 September 2026. Backend implementation and local verification only. No deployment, push, production database change, real notification, commercial change or mobile build.

## What changed

Review and recurring-charge notifications encountered during quiet hours now enter a durable queue. A scheduler-authenticated worker rechecks them on subsequent runs, using current language, token, channel/category preferences and frequency limits. It expires queued work after 24 hours. Queued work does not consume the send allowance; the actual attempt does. Receipt age also starts at the actual attempt, rather than when the item entered the queue.

Only `weekly_brief`, `monthly_review`, `report_ready` and `subscription_leak` are eligible for quiet-hour deferral. Budget alerts and reactivation stages retain suppression: they need separate freshness/activity revalidation before deferral is appropriate. Newly frequency-capped events are not queued; an already queued event can remain deferred by a cap until its original expiry. This prevents an open-ended catch-up backlog.

The queue stores type, timing, an optional source-card UUID and the existing hashed deduplication identity. It does not store generated copy, amounts, merchants or the device token. When a queued review has a source card, dismissing/removing that card cancels the pending notification. Opt-outs and missing tokens also cancel it. Terminal queue routing/source metadata is cleared; the minimal event tombstone is retained for deduplication. A broad ledger-retention/deletion policy remains outstanding.

The worker snapshots at most 50 due candidates and stops starting additional work after eight seconds. Locked users are skipped for a later run. Under the user lock, each row is reloaded and moved from queued to reserved before the provider request. Reserved, accepted and unknown outcomes can never be reclaimed as queued work. A worker crash between reservation and send can lose that notification; avoiding an ambiguous duplicate is deliberate. The existing receipt checker eventually classifies unresolved reservations as unknown.

The local GitHub workflow has a quarter-hour outbox trigger at minutes 7, 22, 37 and 52. Scheduling delays and backlog can make delivery later; exact wake-up timing is not promised. The endpoint's deployment timeout and realistic throughput still require staging validation. No workflow was pushed or enabled by this phase.

## Verification

- Full backend suite: **284 tests passed** (phase 2: 272).
- Scoped Ruff F/E9 and tracked diff whitespace checks passed.
- New tests cover queue deduplication, quiet-hour deferral, current-language sending, changed preferences/category/master switch/token, expiry, non-retry of ambiguous sends, per-user quota, actual-attempt receipt age, source-card dismissal, internal authentication, excluded time-sensitive types and the worker's start-work budget.
- All three notification migrations applied twice in disposable PostgreSQL 16. Verified receipt/outbox columns and indexes, retained RLS/client denial, unique-event rejection and user-deletion cascade.
- Ran `backend/tests/verify_outbox_postgres.py` against a separate synthetic database in that container. Two workers overlapped on two queued events for one user: exactly one provider call occurred, one row was accepted and the other remained queued by the quota. The provider was mocked. This tests real PostgreSQL locks and application code, not live delivery or production-scale throughput. Lock behavior was checked against [PostgreSQL documentation](https://www.postgresql.org/docs/current/explicit-locking.html).
- The synthetic worker fixture initially omitted required user profile fields; adding those fields allowed the concurrency check to execute. The final migration/concurrency run used a fresh container and passed. Container stopped and automatically removed afterward.

Mobile/web source was unchanged in this phase; their phase-2 results remain historical evidence (500 mobile tests, 9 web tests and relevant checks). No new browser or device verification is claimed. The Supabase changelog was checked; this migration uses ordinary additive PostgreSQL columns/indexes and preserves access controls.

## Release dependency and next work

Apply `backend/supabase/migrations/20260911151857_deferred_nudges.sql` after the notification-policy and receipt migrations, before deploying the changed backend model/API. Enable the outbox scheduler only after an isolated staging run verifies preferences, dismissal, concurrent jobs, worker deadlines and real receipts. Do not deploy the dirty shared checkout as one of the separate release task's verified artifacts.

Next programme work: remaining Hindi forms/accessibility/native review; staged client/API/delivery checks; confirmed payday and obligations; consented measurement pipeline; explicit retention policy and higher-volume worker design. Full programme remains incomplete. Pricing/trial/entitlement/provider decisions still await owner review.

Baseline commits unchanged: mobile `5ee13d35c41142680a4cae3c062c9ae2f4279585`; backend `1d5ba6bb8eb02da05fbbd910db36d7bbdc563bfe`; canonical nested web `7d11e4f5d28a6defed8613a15123044a5c6e1663`. Backend changes and continuity/report updates remain uncommitted.
