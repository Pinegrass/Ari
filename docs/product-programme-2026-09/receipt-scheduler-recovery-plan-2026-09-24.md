# Receipt scheduler recovery candidate

Status: prepared, not deployed. No new service, credential, permission, paid resource, scheduled invocation or outreach has been created.

## Problem and scope

GitHub receipt job execution gaps of257.15 and215.25minutes exceeded the120-minute threshold despite a30-minute cron. Readiness itself is scheduled on GitHub and was also sparse. The sampled jobs started promptly after run creation; the evidence does not identify GitHub's internal cause. Increasing cron frequency or HTTP retries is not demonstrated remediation.

The latest inspected readiness run35934437044 finished23September2026 at23:36:57UTC with receipt age122.9minutes, maintenance age939.6minutes, healthy API and matching backend1673c14. Zero-counter receipt runs prove execution, not delivery. Real notification acceptance remains deferred.

## Proposed implementation boundary

1. Keep the existing API and notification gates unchanged. Use the existing runner restricted to `--job push-receipts`, never `all`, outbox, daily or generation jobs. Receipt reconciliation is a write to delivery status and may contact Expo; it is not a read-only health check and needs explicit activation in the deployment plan.
2. Prepare one dedicated, terminating scheduler service from a pinned reviewed backend commit. A Railway cron service is a candidate because the existing application is hosted there; do not create it until its current capabilities, price, limits and permissions have been reviewed. Its only start command is `python scripts/run_scheduled_jobs.py --job push-receipts` and its target is the existing production HTTPS origin.
3. The current shared scheduler token authorizes multiple endpoints. Before distributing a credential to a new service, implement and test an independently scoped receipt credential accepted only by the receipt endpoint, with rotation/revocation and no credential values in arguments/logs. Existing credentials must not be copied to a new service as a shortcut.
4. Prevent overlapping scheduler ownership. Record a cutover time and disable only the old receipt trigger once the new schedule is ready. Preserve all other workflow jobs and gates. Existing receipt locking remains necessary even with one scheduled owner. Never replay sending jobs to manufacture acceptance.
5. Monitor independently of the scheduler failure domain. The existing checker uses GitHub step evidence, so it cannot certify a non-GitHub receipt run without a new evidence adapter. First define authenticated aggregate last-start/last-success/failure evidence for the receipt job and a fixed expected revision. Do not count scheduler invocation, HTTP200 alone, or an unrelated green workflow as success. An independently scheduled read-only monitor must retain the120-minute receipt threshold and fail if its evidence is unavailable.
6. Prepare an operator-owned alert destination and verify receipt plus recovery after authorization. No unsolicited emails/messages or alert subscriptions during preparation. A monitor that depends solely on the failed scheduler is insufficient.

## Required validation before activation

- Local tests: receipt-scoped credential rejected by every other internal endpoint; missing/invalid token rejected; existing internal auth regression passes; secrets and raw provider/user data absent from logs.
- Isolated tests: receipt locking/overlap and delayed token invalidation remain safe; reuse prior PostgreSQL evidence unless touched code invalidates it. Fake provider results must be labelled synthetic.
- Adapter tests: no run, stale run, failed run, unavailable source, wrong deployment, overlap and eventual recovery. Clock skew and future timestamps fail closed. No send retry path.
- Resource review: exact deployment artifact, start command, schedule, target, credential scope, approved cost and monitoring owner documented. These are deployment decisions, not resolved by this candidate.
- Acceptance window: observe at least24hours of actual scheduled completion, including peak hours; record every expected/observed interval and all breaches. This is proposed cadence acceptance, not already collected evidence or a delivery SLO.
- Rollback: revoke the new receipt credential and disable its schedule; re-enable only the previous receipt schedule if authorized and documented. Keep the freshness failure visible, preserve queued/accepted/unknown records and sending gates. A rollback to the previous scheduler does not restore an unproven reliability guarantee.

## Decision and unresolved work

No infrastructure action is taken in this heartbeat. Next implementation candidate is narrowly scoped receipt authentication plus scheduler-independent aggregate execution evidence, followed by isolated verification and a reviewed deployment/cost decision. External alert receipt, physical push acceptance, and representative production load remain separate gates.
