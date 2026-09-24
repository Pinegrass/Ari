# Local verification continuation — 24 September 2026

No production deployment, permissions, credentials, schedules or notification gates were changed. No devices, real user histories or paid providers were used.

## Receipt authentication preparation

Backend `671dc8dca41afe0e2de7f55743fc1fd100a75ddb` adds optional receipt-only authentication to the existing receipt endpoint. It accepts `X-Receipt-Token` only when the separate `RECEIPT_SCHEDULER_TOKEN` is configured and differs from the general scheduler secret. Invalid explicit scoped credentials never fall back to broader access. The eight other internal coaching routes reject the receipt credential. Existing general-token access remains compatible.

Independent review found no blocking issue. The full backend suite passed668tests with four existing SQLAlchemy warnings. Two subsequent test-only additions cover genuinely unset variables and valid scoped/invalid general-header precedence; the final focused auth suite passed20tests. The full suite was not rerun for those two test-only additions. No real receipt reconciliation occurred; the worker was mocked.

This prepares a credential boundary, not a reliable scheduler. A receipt-only caller, scheduler-independent aggregate execution evidence, reviewed deployment/cost decision, independent monitoring and cadence/recovery acceptance remain pending. The generic runner still uses the broad credential and must not be handed to a new dedicated service as a shortcut.

## Release and acceptance boundary

Live backend remains1673c14/Railway099478be-67d6-4e15-9992-8a0481aebe79. Live web remainsd39ad2c/Verceldpl_5QkwZBza1UPEVEtoXdXJqoncNp6J, with local copy candidatea060351. Mobile app source9ed8a704 and internal OTA remain unchanged and device-unverified. Prior browser cold-reload/Hindi acceptance and cleanup remain valid.

Notification display/receipt/tap acceptance remains deferred; both sending gates remain off. Production load, external alert delivery/recovery, full infrastructure restoration, BillDesk/Play/purchase lifecycle, human Hindi/legal/native accessibility review and elapsed consented pilot remain open. No sprint is newly fully accepted.

## Isolated PostgreSQL evidence

Backend evidence commit `57ff836f278af2d507e93e938c86519162a879fe` records36/36matching old/new query results on PostgreSQL17.11, synthetic owners with1k/10k/100krows each, and1/6/24month ranges plus leap/year-rollover/empty cases. All nine large-fixture new plans use the owner/date index bounds. Detailed SQL, plans, timing limitations and cleanup are in `backend/docs/report-date-index-postgres-2026-09-24.md`; raw artifact SHA256 is `4181b9e95618b106058a7fd04f6f6e1b4b73e38fcbcd6a745ad4d512683be892`. Root verified the raw result, hash, equality and cleanup flags.

The reduced schema and single warm executions do not establish full-schema/RLS, production latency, concurrency or ORM memory acceptance. The exact network-isolated container was removed with its anonymous volume. Harness cleanup was subsequently hardened and compiled; no SQL measurement changed. Prior proofs were not rerun.
