# Ari scheduled-job operations runbook

## Current release checkpoint — 20 September

The historical observations below are retained for traceability. Current backend is
`05a856ffa4d64a5f2523a596ff2a620149620133`, Railway
`9f4bb193-4abe-4e1b-a989-1b480b54a5be`. The paginating runner and hourly read-only
readiness workflow are published; `ARI_EXPECTED_BACKEND_REVISION` matches this SHA.
Run35524566660 passed health, revision and actual receipt/maintenance freshness.
Seven reviewed migrations and logical public/auth backup restoration are verified;
see `release-continuation-2026-09-20.md` and `backup-restore-acceptance-2026-09-20.md`.

Daily/outbox schedules remain disabled. The outbox API itself has no environment
gate: do not invoke manual `all` or `nudge-outbox` for diagnostics. No external
alert delivery/recovery, managed PITR, complete infrastructure recovery or physical
notification acceptance is claimed. Supabase leaked-password protection awaits
dashboard access; authenticated group-helper execution is intentionally retained
with caller identity restriction. Use the current SHA in the checker command,
not the older examples retained below.

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

## Prepared runner improvement — not live
Backend local f79ec76 detects reported batch errors despite HTTP200 and emits aggregate-only summaries. Policy skips remain non-failures; receipt failed/unknown counters fail without retries. Historical live logs still use the old runner until release.326 backend tests passed; no external alert route configured.

## Prepared legacy retention boundary fix
Local backend4d39f87 now deletes UTC dates on or before today−90, conservatively removing the boundary day.340tests pass; no live purge. Exact deletion timing still depends on job execution. See retention-boundary-2026-09-15.md.


## Executable read-only readiness check — 19 September 2026

From backend:

```powershell
.venv/Scripts/python.exe scripts/check_operational_readiness.py --expected-revision b8556303627323581193967e6cd97b7676aef066
```

Use the exact intended deployed SHA after each authorized release. The checker only
reads `/api/health` and GitHub run/job metadata through the existing `gh` login. It
never invokes a job, reads raw job logs, sends alerts or changes notification gates.
It inspects actual non-skipped step completions within a bounded 32-hour/300-run window;
a green workflow alone does not satisfy the check. Exit 0 means checks pass, 1 means
unhealthy/mismatched/stale/failed or missing execution evidence, and 2 means inspection
was unavailable. Sanitized output includes step ages and the next diagnostic action.

Observed by the root operator on 19 September: health and expected revision passed;
maintenance age was 365.6 minutes; receipt age was 120.3 minutes and therefore exceeded
the two-hour threshold. This is a freshness warning requiring read-only scheduler
inspection, not permission to rerun sending jobs. It proves neither an actual receipt
backlog nor provider delivery failure. No external alert channel is configured by this
tool; backup restoration and actual device delivery remain separate acceptance gates.


Prepared workflow `.github/workflows/operational-readiness.yml` runs this read-only
check hourly and on manual dispatch, with only `contents: read` and `actions: read`,
a ten-minute timeout and one concurrent inspection. It requires repository variable
`ARI_EXPECTED_BACKEND_REVISION` to contain the full approved deployed SHA; missing or
invalid configuration fails clearly instead of assuming repository HEAD is live.
`API_BASE_URL` may select the intended HTTPS origin. Workflow publication and variable
configuration remain pending; no repository variables were changed here. A failed
GitHub check is the operator signal, not an installed external alert integration.

## Paged v2 cleanup candidate — 19 September

Backend7209325 limits measurement cleanup to100 selected accounts per transaction;
the scheduled-job runner follows UUID cursors and aggregates counts. Publish that
runner before or with the backend: older runners stop after one maintenance page.
Legacy count/delivery cleanup runs only on the first page and is still globally
unbounded. A partial/failed sweep is not complete retention enforcement. See
`maintenance-pages-2026-09-19.md` for415-test and isolated PostgreSQL race evidence.
This candidate remains unpublished; do not invoke production jobs for acceptance.
