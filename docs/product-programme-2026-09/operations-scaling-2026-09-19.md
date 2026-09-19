# Bounded operational cleanup — 19 September 2026

Local implementation; no production maintenance, notification sending, device access, schema change or release performed.

## Behaviour

Each maintenance request selects at most 100 legacy count keys, 100 expired queued deliveries, 100 stale reserved/accepted deliveries and 100 terminal deliveries with metadata still present. The existing measurement-v2 phase independently checks at most 100 accounts. Selected delivery keys are updated only if their eligibility predicate still matches, so a receipt transition between selection and mutation is not blindly overwritten. One transaction commits the page.

An internal opaque versioned cursor carries each unfinished phase's keyset position. Finished phases are skipped. Legacy UUID cursors remain accepted as v2-only continuation, matching their former meaning. New rows or newly eligible rows behind a position wait for the next sweep. Existing 90-day UTC boundary deletion, 24-hour unknown-outcome transition, seven-day metadata clearing and retained event-key tombstones are unchanged. Terminal rows already stripped of metadata do not generate repeat updates forever.

The scheduler continues opaque cursors, aggregates counts and keeps cursor identifiers out of normal CI summaries. An explicit 10,000-page ceiling fails closed instead of looping forever. A sweep that reaches that ceiling requires operational inspection; the next scheduled sweep restarts at the beginning, so the cap is not a guarantee that arbitrarily large datasets finish.

## Tombstone policy

`GET /api/coaching/product-maintenance/tombstones` requires the existing internal scheduler token and returns at most 100 rows' aggregate volume observations with a UUID continuation cursor. It returns no user IDs, event keys, tokens or provider details. Results explicitly say `page_estimate`; concurrent writes mean aggregated pages are not an atomic database census. No provider replay horizon has been established, so tombstone deletion remains disabled. This endpoint never invokes maintenance or sends notifications.

## Verification and limits

Focused SQLite tests exercise 205 legacy rows and 615 deliveries over multiple pages, retained recent rows, retained tombstones, stable termination, predicate rechecks after a simulated receipt transition, internal authorization, malformed cursors, old UUID compatibility and scheduler page limits. Existing maintenance-account pagination/retention and scheduler fixtures are included. SQLite predicate tests do not establish PostgreSQL locking behaviour; prior separate PostgreSQL account-lock proof remains applicable to unchanged `measurement_v2.maintain`.

Limits apply to selected keys and mutations, not a claim of constant database scan time. Existing indexes include the legacy retention day, delivery primary key, pending receipt and queued schedule indexes; production query-plan/volume observation remains a rollout check. V2 per-account receipt deletion is independently owned by the measurement implementation.

No migration is required by this change. Publish the paginating runner before or with the backend; older non-paginating runners cannot complete a sweep. Do not persist versioned in-progress cursors through rollback to a backend that only understands UUID cursors; restart a sweep instead. Notification daily/outbox gates and all device holds remain unchanged.

## Streamed measurement reporting

The core report now reads a single ordered scalar SQL result in 500-row fetch batches, replacing full-population ORM loading and receipt lists. It retains only the current account's distinct meaningful local days and event types plus aggregate counters. The latest meaningful receipt for each local day preserves post-activation cohort membership; the reference cohort calculator is applied to one compressed account at a time and its counts merged before rates are calculated. This bounds Python state by the retention window, rather than total accounts or receipts. It does not bound total SQL work or report elapsed time; production load/query-plan verification remains separate.

`postConsentMilestones` reports distinct-account counts and fractions for recorded entry, planning, report display, report action and trial milestones. The denominator is all current consented, nonexcluded episodes, including inactive and recent opt-ins. Only retained 90-day receipts from that exact episode contribute. Milestones are explicitly unordered, not a sequential funnel or causal conversion rate. Preauthentication onboarding remains unavailable because no preconsent tracking was added. This intentionally closes safe post-consent observability without claiming an unavailable full signup funnel.

Notification attribution remains the separately owned dispatch report. Verified billing outcomes consume the same retained event counts through `billing_measurement.outcomes`; these are observed verified events, not subscriber conversion.

Verification: 63 maintenance/retention/scheduler tests passed; 27 streamed-report/v2/reference-cohort tests passed, repeated successfully after the final billing-report hookup. New streaming fixtures cross multiple fetch batches, compare reference cohort outputs across UTC/Kolkata/Los Angeles, preserve empty/inactive accounts, reject stale epochs and expired/future receipts, and bound per-account day representations. Scoped Ruff F/E9 and diff whitespace checks passed. All evidence is local synthetic testing, not production or provider acceptance.
