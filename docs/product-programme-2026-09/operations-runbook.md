# Ari scheduled-job operations runbook

## Current release checkpoint — 24 September

The historical observations below are retained for traceability. Current backend is
`1673c1479a1dc9c579a94af5b2cd6cdfb61154aa`, Railway
`099478be-67d6-4e15-9992-8a0481aebe79`. The paginating runner and hourly read-only
readiness workflow are published; `ARI_EXPECTED_BACKEND_REVISION` matches this SHA.
Run35909949244 passed health/revision/freshness. Later scheduled checks failed receipt freshness:35891197530 at186.5minutes,35914460602 at135.4minutes, and35934437044 at122.9minutes (23September23:36:57UTC). Health/revision/maintenance passed on the latest failure. These are historical observations, not a claim about current freshness. The receipt cadence gap remains unresolved.
Seven reviewed migrations and logical public/auth backup restoration are verified;
see `release-continuation-2026-09-20.md` and `backup-restore-acceptance-2026-09-20.md`.

Daily/outbox schedules remain disabled. Both server gates are explicitly false;
the outbox API now has an independent default-off guard. Do not invoke manual `all`
for diagnostics because other jobs can generate content or send. No external
alert delivery/recovery, managed PITR, complete infrastructure recovery or physical
notification acceptance is claimed. Supabase leaked-password protection was enabled
and independently verified in the dashboard/advisor; authenticated group-helper execution is intentionally retained
with caller identity restriction. Use the current SHA in the checker command,
not the older examples retained below.

Scope: inspect and diagnose existing jobs without sending notifications, generating paid content or altering user data. This is an operator procedure; no alert integration is installed by this document.

## Current service and historical evidence

API health: https://web-production-7c65f.up.railway.app/api/health. Compare against the exact deployed revision in the current checkpoint above. Do not use historical source references below as rollback targets without checking migrations and client contracts.

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

## Active check thresholds and pending external alerts

The readiness workflow checks health, revision and receipt/maintenance freshness. External alert delivery and recovery are still unverified. Poll read-only evidence without triggering jobs. Record last successful execution per actual job step and timestamp, plus source revision.

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
8. For an application rollback, choose a reviewed compatible artifact from the latest release record and assess applied migrations and client contracts first. The September13 release is historical, not a default rollback target. Rollback is an incident action, not a read-only check.

## Open operational gates

External alert delivery/recovery, scheduler reliability, representative load/query plans and full infrastructure recovery remain open. Logical public/auth restore, reviewed security hardening and scoped session/export/deletion checks have evidence in the current checkpoint reports; do not repeat them merely because older entries below predate completion. S3 remains in progress. All device testing remains pending by owner; do not resume through this runbook.

## Historical checkpoint — prepared runner improvement (now superseded)
Backend local f79ec76 detects reported batch errors despite HTTP200 and emits aggregate-only summaries. Policy skips remain non-failures; receipt failed/unknown counters fail without retries. Historical live logs still use the old runner until release.326 backend tests passed; no external alert route configured.

## Historical checkpoint — prepared legacy retention boundary fix (now superseded)
Local backend4d39f87 now deletes UTC dates on or before today−90, conservatively removing the boundary day.340tests pass; no live purge. Exact deletion timing still depends on job execution. See retention-boundary-2026-09-15.md.


## Executable read-only readiness check — 19 September 2026

From backend:

```powershell
.venv/Scripts/python.exe scripts/check_operational_readiness.py --expected-revision 1673c1479a1dc9c579a94af5b2cd6cdfb61154aa
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


Published workflow `.github/workflows/operational-readiness.yml` requests this read-only
check hourly and on manual dispatch, with only `contents: read` and `actions: read`,
a ten-minute timeout and one concurrent inspection. It requires repository variable
`ARI_EXPECTED_BACKEND_REVISION` to contain the full approved deployed SHA; missing or
invalid configuration fails clearly instead of assuming repository HEAD is live.
`API_BASE_URL` may select the intended HTTPS origin. Workflow publication and variable
configuration were completed on September20. Observed execution is sparser than the configured cadence. A failed
GitHub check is the operator signal, not an installed external alert integration.

## Historical checkpoint — paged v2 cleanup candidate, 19 September (now superseded)

Backend7209325 limits measurement cleanup to100 selected accounts per transaction;
the scheduled-job runner follows UUID cursors and aggregates counts. Publish that
runner before or with the backend: older runners stop after one maintenance page.
Legacy count/delivery cleanup runs only on the first page and is still globally
unbounded. A partial/failed sweep is not complete retention enforcement. See
`maintenance-pages-2026-09-19.md` for415-test and isolated PostgreSQL race evidence.
This candidate remains unpublished; do not invoke production jobs for acceptance.
