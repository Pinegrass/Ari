# Ari implementation and acceptance audit — 19 September 2026

## Verdict

Substantial S3, S4, S6 and S7 implementation is prepared and locally verified across the three canonical repositories. The programme is **not fully accepted**. These changes have not been deployed or published. Device acceptance, provider configuration, operational restore/alert acceptance and real pilot outcomes remain distinct gates.

This audit supersedes statements that measurement v2 storage/transport and historical intelligence have not been implemented. It does not supersede the owner's device hold or authorize notification rollout.

## Delivered in this implementation batch

| Area | Concrete change | Verification boundary |
|---|---|---|
| Measurement | Versioned explicit consent, random consent epochs, memory-only client state, retry-stable event UUIDs, server-confirmed transaction/planning/trial events, account-switch and private-mode guards | Synthetic API/client tests and isolated PostgreSQL races; no production cohorts |
| Measurement lifecycle | Withdrawal and staff/test exclusion purge, re-consent isolation, export, exact 90-day event expiry, frozen IANA timezone, bounded daily receipt volume | Expiry on ingestion/export/maintenance; physical deletion still depends on execution |
| Reporting | Completed-local-day D1/D7/D30, rolling 7/30-day activity and return-frequency distributions, explicit measured population and unavailable paid/notification attribution | Synthetic timezone/DST/maturity fixtures; real elapsed outcomes unavailable |
| Account deletion | Input validation, attempt limiting, verified reauthentication identity, global refresh-session logout before deletion, sanitized provider failures | Mocked provider/security regressions; existing access JWT expiry is unchanged |
| Database functions | Fixed search paths, restricted direct trigger execution, caller-bound group membership checks while preserving RLS | Actual migration executed on isolated PostgreSQL16; not yet applied to Supabase |
| Operations | Read-only health/revision/job freshness checker, scheduled workflow candidate and recovery runbook | Actual job steps inspected; alert routing is not activated |
| Hindi/accessibility | Localized operational errors, field names, status/error announcements, skip navigation, signed-in page titles, safe payment copy | Automated tests/types/lint/build; human Hindi and screen-reader acceptance pending |
| Review intelligence | Source IDs/revisions, exact owned entries, correction routes, stale-edit protection, confirmed planning outlook with freshness | Synthetic edits/deletion/ownership/concurrency tests |
| Recurring patterns | Conservative monthly expense/payday candidates with source dates and explicit confirmation | No automatic creation from a prediction; real recurring workflow acceptance pending |
| History | Three completed months of recorded spending/category medians and income consistency, with missing history kept unknown | Deterministic sufficiency/transfer/currency/history fixtures |
| Tomo | Fixed missing prompt context, excluded future entries, corrected net-flow wording, added context provenance and source inspection | Generated claims remain unverified AI interpretation; no real provider call in this batch |
| Planning retries | Business confirmation IDs and snapshot revisions prevent lost-response retries from refreshing stale inputs, overwriting newer confirmations or resurrecting deleted plans | Old clients retain compatibility; new clients preserve retry identity separately from analytics consent |
| Account boundaries | API request/session guards prevent response or retry reuse after logout/account changes and suppress stale refresh mirroring | Paused-request race regressions; no live provider/session acceptance claimed |

## Measurement decisions

- V2 requires explicit consent. Legacy consent/counts are not silently promoted or reinterpreted.
- Financial properties, merchants, financial record IDs and arbitrary client properties are not included in measurement receipts.
- Retry deduplication lasts for the retained 90-day receipt window. Clients use one immediate retry and no durable analytics queue. There is no indefinite deduplication claim after deletion.
- Activation is the first server-confirmed transaction creation after consent. Expired activation timestamps are erased; a minimal expired-state bit prevents fabricated reactivation. Consent epoch/timezone/state persist until withdrawal.
- Exclusion is an explicit server-managed UUID-based operation, not an email heuristic or client role. Removing exclusion does not opt the person in.
- Internal reports describe currently consented, non-excluded accounts. Withdrawal changes historical results. Old financial activity is never backfilled into analytics.
- Notification attribution and verified paid renewal/churn remain unavailable; aggregate activity is not a conversion rate.
- Return-frequency buckets count distinct meaningful days over7/30 completed local dates, including zero-day current consented accounts. Recent opt-ins are included without tenure normalization; bucket totals match their explicit measured denominator.

Planning deletion erases financial inputs, their fingerprint and ledger reference. A minimal random revision/deleted marker remains to reject delayed saves; account deletion removes that row. Export returns no deleted planning data, and deleted plans do not generate reconfirmation nudges. This business retry state is independent of measurement opt-in.

## Verification

**403 backend tests, 570 mobile tests across 53 suites, 113 web tests across 9 files passed**. Mobile TypeScript, changed-source ESLint, backend Ruff F/E9, and web production build (14 pages) passed. Two test import-order warnings were fixed; the subsequent 11-test planning slice passed and exited successfully after a delayed-shutdown warning. The full mobile run had no such warning.

`backend/tests/verify_measurement_postgres.py` exercised the exact v2 migration on a disposable PostgreSQL16 database: RLS/role restrictions, concurrent retry, one confirmed creation, transactional rollback, withdrawal/re-consent and exclusion races, account cascade, and competing corrections. Fixtures and container were removed.

`backend/tests/verify_helper_hardening_postgres.py` exercised actual helper migration SQL and canonical trigger bodies: provisioning and update triggers still work, own group membership works through RLS, other-user and missing-identity probes fail. Its separate disposable container was removed.

No device was accessed, no push was sent, no scheduled business job was manually triggered, and no production database mutation was performed in this batch.

## Read-only live observations

- Health returned the recorded live backend revision `b8556303627323581193967e6cd97b7676aef066`.
- Readiness checker found maintenance within its 30-hour threshold and receipt execution approximately 120.3 minutes old, just beyond its 2-hour threshold. This was one timestamped observation, not a continuing outage diagnosis. It did not rerun jobs or send alerts.
- Supabase advisor reported mutable helper search path and broadly executable definer functions; the candidate migration addresses those reviewed helpers. Auth leaked-password protection remains disabled in the observed configuration.
- Six server-only tables with RLS but no client policies are intentional. Do not add client access merely to silence an informational advisor item. The authenticated membership helper deliberately remains a constrained SECURITY DEFINER function to avoid recursive RLS.

## Release candidate order

1. Review backup/recovery readiness and exact three-repository candidate commits. Preserve existing live artifacts for rollback.
2. Apply additive `backend/supabase/migrations/20260919132311_measurement_v2.sql` **before backend deployment**. Core business writes now reference v2 tables even when collection is disabled.
3. Apply separately reviewed `20260919134713_harden_internal_helpers.sql`; verify actual Supabase RLS/trigger behavior and rerun advisors. Isolated PostgreSQL16 does not replace Supabase17 acceptance.
4. Deploy the exact backend candidate and verify old/new client auth, transaction, planning, consent/export/deletion, trial and entitlement contracts with disposable fixtures.
5. Deploy web and publish a runtime-compatible Android internal candidate only under the applicable release authorization. Record all exact artifacts and retain the device hold.
6. Configure the readiness workflow's `ARI_EXPECTED_BACKEND_REVISION` to the actual deployed full SHA and establish an alert recipient/recovery acceptance. Publishing workflow source alone is not active monitoring.
7. Keep daily/outbox gates disabled until actual notification acceptance. Do not infer provider, store or permission changes from this checklist.

Rollback compatibility: older backend code does not understand new planning confirmation fields or deletion markers. Do not simply restore the old backend beneath updated clients or retained planning tombstones. Prepare a compatible rollback build (or a reviewed forward fix) and coordinate client versions first; no automatic data cleanup is part of rollback.

No push, migration application, backend/web deployment, OTA publication or workflow configuration was performed by this implementation batch. The prior recorded live backend/web/Android artifacts remain unchanged.

## Remaining completion gates

| Gate | Outstanding evidence/action |
|---|---|
| Coordinated candidate release | Reviewed migration application, deployments and authenticated live acceptance of this batch |
| Android and notifications | Owner-resumed device checks, real provider acceptance/receipt/display/tap, combined reminder experience, deliberate rollout |
| Operational acceptance | Actual backup restore with integrity checks; production helper verification; password-protection configuration decision; actionable alert delivery/recovery |
| Commerce | Play release permissions, BillDesk verification, configured store/RevenueCat catalogue and real purchase/restore/renewal/refund lifecycle |
| Language/accessibility | Human Hindi review, screen reader/font scale/focus/touch checks, live performance and remaining static/legal/provider-language inventory |
| Measurement | Validated notification attribution and verified paid lifecycle metrics; real elapsed D1/D7/D30, renewal/churn and willingness-to-pay evidence |
| iOS | Separately deferred Codemagic/TestFlight/iPhone acceptance |
| Pilot/final audit | Consented real users, repeated useful actions and correction burden, elapsed outcomes and final original-brief mapping |

See [intelligence evidence](intelligence-evidence-2026-09-19.md), [helper hardening](helper-hardening-2026-09-19.md), [operations runbook](operations-runbook.md), and the canonical `.ai/sprints.yaml` ledger. Automated tests establish engineering behavior, not production adoption or commercial success.

The [original A–T deliverable map](programme-gap-map-2026-09-19.md) also identifies remaining engineering, including onboarding funnel coverage, delivery-owned notification attribution, paid lifecycle analytics, broader Hindi/performance checks and operational scale work. These must not be mislabeled as entirely blocked by external accounts or the device hold.

## Exact local source candidates

- Mobile: `3035cb392df315c2f222068a7a4096d636c588cb`
- Backend: `7209325904a9814bceb5a44cad2bbee5d309563f`
- Authoritative nested web: `860b42006ce2cff300fc019453375b50ca9bd778`

These are local commits, not published artifacts. Subsequent parent documentation commits record this audit without changing these source candidates. Existing unrelated untracked historical reports and web AGENTS/CLAUDE files were preserved.

Backend follow-up: `7209325` supersedes `22c360c` with bounded v2 maintenance account locking and scheduler pagination.415 full backend tests and a new isolated PostgreSQL disappearing-account proof pass. Client sources/results above are unchanged. See [maintenance evidence](maintenance-pages-2026-09-19.md), including runner-first rollout and remaining global-cleanup limits.
