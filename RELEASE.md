# Ari release and operations workflow

The authoritative release record is `.ai/20-CURRENT-STATE.md` and the linked dated report. Read `.ai/sprints.yaml` for acceptance gates. Code completion, publication, live verification and product acceptance are separate states.

## Coordinated release

1. Inspect independent Git status and exact commits in mobile, `backend/`, and authoritative `aritomo-web/`. Preserve unrelated work.
2. Capture a private, consistent database backup and verify isolated recovery. Check deployed migration history and exact schema before applying reviewed migrations. MCP-generated migration versions differ from local filenames: match recorded names/content, never blindly replay files.
3. Apply reviewed additive schema before backend code. Keep user data, historical unknown currency and unknown provider provenance intact.
4. Publish the paginating scheduled-job runner before or with its compatible backend. Set the Railway `RELEASE_REVISION` to the deployed commit; verify `/api/health` and first-party authenticated contracts using disposable fixtures, then verify cleanup.
5. Configure `ARI_EXPECTED_BACKEND_REVISION` to that exact commit for the read-only hourly GitHub readiness workflow. A green skipped job is not execution evidence.
6. Build the web candidate with production configuration; inspect it before promoting the public domain. Legal publication needs complete business/contact information.
7. Verify Android production-environment fingerprint against the installed native runtime before an `internal-release` OTA. A lockfile alone is insufficient if local dependencies have drifted. Never override runtime compatibility. Store/native/iOS releases require their own recorded scope.
8. Record all source commits, migration mappings, provider artifact IDs, verification results and remaining gates in a dated release report and the continuity pack.

## Notification controls

Daily nudges have three local-time opportunities (09:00, 14:00, 19:00) when deliberately enabled. Saved lower limits remain effective; bill reminders are separate. Old/offline clients need acceptance of the combined experience.

Keep Railway `DAILY_NUDGES_ENABLED=false`, `NUDGE_OUTBOX_ENABLED=false`, and GitHub daily/outbox schedule variables disabled until actual acceptance. The outbox API now has an independent default-off server guard. Manual `--job all` can still invoke other content/sending jobs: never use it as a release diagnostic. Receipt lookup does not resend, but receipt success alone does not prove device display. See backend `docs/notification-rollout-gates.md` for guard scope and in-flight limitations.

Follow `docs/product-programme-2026-09/operations-runbook.md` for scoped read-only checks. Verify actual job steps, latest revision and freshness; investigate failures without blind reruns.

## Measurement, billing and privacy

Measurement v2 requires explicit current-epoch consent. Never auto-enrol existing accounts or backfill pre-consent financial history. Client event IDs deduplicate within retained 90-day history; account changes discard in-memory consent. Withdrawal, exclusion, export and expiry cover receipts, notification attribution and optional verified billing observations.

Notification-open association and verified paid lifecycle reporting are implemented. Real D1/D7/D30, renewals and willingness to pay need actual consented observations and elapsed time. Uncollected signup census, missing webhook history, revenue/refunds and net subscriber churn remain unavailable rather than zero.

Approved pricing is INR149/month or INR1499/year with a14-day no-card trial after first value. Provider-verified backend state owns paid access. Store catalogue, BillDesk verification and real purchase/restore/renewal/refund acceptance remain external gates. Do not infer success from checkout UI or UPI launch.

## Compatibility and rollback

New group writes require captured immutable currency and exact expense UUID retry handling. Legacy groups require creator confirmation of their historical unit, without FX conversion. Old clients can receive409 until updated. Release compatible clients closely after backend readiness.

Preserve schema and planning/group/idempotency compatibility during rollback. Restart maintenance sweeps when changing cursor protocol. Select exact known-compatible artifacts from dated reports; do not blindly republish an old branch or drop new tables.

## Acceptance still required

Device testing remains paused until the owner resumes it; iPhone is separately deferred. Production security, alert delivery/recovery, representative load, human Hindi/native accessibility, legal review and elapsed pilot evidence must be recorded independently. Automated tests and a successful deployment do not close these gates.
