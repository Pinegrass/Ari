# Ari scheduled-job operations runbook

Scope: inspect and diagnose existing jobs without sending notifications, generating paid content or altering user data. This is an operator procedure; no alert integration is installed by this document.

## Current service and evidence

API health: https://web-production-7c65f.up.railway.app/api/health. Expected deployed revision b8556303627323581193967e6cd97b7676aef066 as last checked14 September 2026; update this reference with each authorized release. Health currently reports healthy. Local backend 79bf2c3 is newer and unpublished.

GitHub workflow: Pinegrass/ari-backend, scheduled-jobs.yml. Inspect the actual step and its HTTP result, not just the workflow conclusion. A run can succeed while every job step is skipped because daily/outbox gates are disabled.

Observed14 September 2026:

- Run 34820989626: Product data retention step succeeded; 08:06:14UTC HTTP 200, eventCountRowsDeleted0/outcomesUnknown0/queuedExpired0/terminalMetadataCleared0. This proves the endpoint ran, not that deletion of nonempty records was exercised.
- Run 34816725158: Push receipts step succeeded; 07:11:57UTC HTTP 200, checked0/failed0/pending0/providerDelivered0/unknown0. This proves scheduler-to-API access, not provider receipt resolution or device display.
- Runs 34848277960 and 34813536640 succeeded with no product job steps executed. Do not count these as receipt or maintenance success.
- GitHub daily/outbox variables are absent; automatic sends remain gated off. No manual endpoint was triggered by this audit.

## Routine read-only inspection

From backend, with the existing GitHub CLI login:

```powershell
gh run list --repo Pinegrass/ari-backend --workflow scheduled-jobs.yml --limit 20 --json databaseId,createdAt,status,conclusion,headSha,url
gh run view <run-id> --repo Pinegrass/ari-backend --json jobs
gh run view <run-id> --repo Pinegrass/ari-backend --log
```

Inspect logs privately. Receipt and maintenance endpoints return aggregate counts; older generation jobs can include user identifiers and error excerpts. Never paste raw secret-bearing settings, tokens or identifiable financial data into reports. Increase the run-list window if twenty runs contain only skipped job steps. Check GitHub workflow state and recent failures before assuming a job was absent.

Read /api/health and compare the exact revision to the recorded deployed artifact. A health response alone does not prove authentication, database persistence, payment entitlement or notification delivery.

## Proposed alert criteria

These are operational thresholds for review, not currently active alerts. Poll read-only evidence without triggering jobs. Record last successful execution per actual job step and timestamp, plus source revision.

| Condition | Severity / response |
|---|---|
| API health fails or unexpected revision appears | Investigate promptly; inspect deployment status and sanitized error logs before any rollback |
| Any job HTTP 401/403 | Check configured secret presence and intended target privately; do not disclose or rotate secrets speculatively |
| Any job HTTP 500, runner timeout or malformed response | Inspect matching deployment logs and job inputs; do not blindly rerun a sending job |
| No successful receipt step for 2 hours | Investigate workflow delays and API access; alert on actual receipt backlog separately |
| No successful maintenance step for 30 hours | Investigate scheduling and API failure; inspect backlog before authorizing a catch-up run |
| Increasing pending receipts or unknown outcomes | Inspect age and provider failure evidence; acceptance and device display remain distinct |
| Active sends despite disabled gates | Identify which legacy/local/server channel sent; preserve evidence and stop the responsible path under incident authorization |

Thresholds are initial engineering proposals. An empty queue is not an incident. GitHub cron may run late: the maintenance run above started08:06UTC against a 02:43UTC schedule. Cadence alone cannot support a precise delivery-time promise. Current daily nudge windows skip missed hours rather than delivering a catch-up burst.

## Failure handling and safety boundaries

1. Capture run/deployment IDs, timestamps, route, response status and aggregate counts.
2. Verify whether the relevant job actually ran and whether the executing source matches the intended release. Local scheduler pagination improvements are not live until separately published.
3. Distinguish outcomes: reserved means an attempt was reserved; accepted means Expo issued a ticket; provider_delivered means the receipt succeeded; unknown means outcome could not be established. None proves physical display or user action.
4. Never resend an accepted/unknown attempt to obtain proof. Preserve dedupe reservations. Receipt lookup may retry within its existing policy; it never resends a notification.
5. A delayed DeviceNotRegistered receipt must not remove a newer token; existing token-hash matching protects this. Do not manually clear account tokens.
6. Maintenance expires queued work, clears old terminal metadata, resolves stale pending outcomes and removes old consented counts. It retains event tombstones. A bounded tombstone-retention policy and growth monitoring remain open work.
7. Do not run --job all as a diagnostic: it includes generation/sending endpoints. Do not enable DAILY_NUDGES_ENABLED or NUDGE_OUTBOX_ENABLED until actual receipt/display/tap acceptance is complete and activation is authorized.
8. For an application rollback, use the exact references in coordinated-release-2026-09-13.md and assess client contracts first. Older backend lacks acknowledged Home dismissal. Rollback is an incident action, not a read-only check.

## Open operational gates

Alert delivery/channel ownership is not configured or verified here. Backup restore, existing database security-advisor findings, session revocation and full export/deletion isolation require separate acceptance. S3 remains in progress. All device testing remains pending by owner; do not resume through this runbook.
