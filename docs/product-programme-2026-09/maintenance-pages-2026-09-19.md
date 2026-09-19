# Bounded measurement maintenance — 19 September 2026

Backend candidate `7209325904a9814bceb5a44cad2bbee5d309563f`, local and unpublished. Mobile `3035cb3` and authoritative web `860b420` unchanged. No device, provider, notification, live database or release action.

Cold start found no source changes since the integrated candidate. S1's completed PostgreSQL notification evidence and combined-channel audit were inspected; real delivery/device acceptance remains deferred. No notification proof was unnecessarily rerun.

## Change

V2 cleanup previously selected all consented accounts, locked each user and held every lock until the whole maintenance transaction completed. It could also abort when an account disappeared between selection and locking.

The service now selects at most100 accounts using the existing indexed user ID and one look-ahead row. Each HTTP page commits before the runner requests the next. User locking still serializes expiry with ingestion, consent withdrawal and exclusion; deletion between selection and locking safely skips the missing account. The cursor follows selected IDs even if an account disappears. The checked count means selected accounts, including deletion skips.

The internal route validates UUID continuation cursors. The scheduler follows maintenance pages iteratively, adds aggregate counters, rejects malformed/repeated cursors and invalid counts, and does not retry ambiguous network failures. Account cursors are excluded from its summary logs. Legacy count/delivery cleanup runs only on the first page, preserving its existing semantics.

## Evidence

- **415 full backend tests passed**; scoped Ruff F/E9 and Git diff checks passed.
- New HTTP/service/runner regressions cover205 accounts, independent page commits, exact expiry boundary/recent-data preservation, deleted cursor continuation, internal authorization, invalid cursor/page size, counter aggregation and non-retry failures.
- Independent bounded agent extended verification with `backend/tests/verify_measurement_maintenance_postgres.py`. Actual PostgreSQL16 passed103 accounts across committed100/3 pages and deterministic withdrawal/deletion after selection but before locking. Remaining pages progressed and no state was recreated. Root reviewed the verifier and integrated source.
- Dedicated loopback PostgreSQL fixture tables and container were removed. No application configuration or production credentials were loaded by that verifier. Existing notification acceptance was not rerun; mobile/web tests were not rerun because those sources did not change.

## Limits and release ordering

This bounds **v2 account locks per transaction**, not receipt rows per account, SQL execution time, all maintenance work, or report memory. First-page legacy count and notification metadata updates remain global; large-population report aggregation and notification tombstone policy remain engineering gaps. Newly consented accounts behind a cursor wait for ingestion/export expiry or the next full sweep. Physical deletion still depends on successful maintenance execution.

Publish the updated scheduled-job runner before or with this backend during an authorized release. The old runner does not follow maintenance cursors and would stop after the first page. The new runner accepts the prior single-page maintenance response, allowing runner-first rollout. Inspect aggregate account totals and terminal cursor completion in synthetic release acceptance. Do not run production jobs merely to test this change.

Prior measurement migration→backend→client ordering, planning rollback compatibility, owner device hold and disabled daily/outbox gates still apply. No sprint is newly accepted by this increment.
