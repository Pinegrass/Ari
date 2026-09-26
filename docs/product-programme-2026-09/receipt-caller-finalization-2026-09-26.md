# Receipt caller finalization — 26 September 2026

No production deployment, credential, schedule, notification gate, provider call or user record was changed.

Backend candidate `ed2af90` completes the local caller half of the receipt-scoped authentication prepared in `671dc8d`. A dedicated `--job push-receipts` run now fails closed unless `RECEIPT_SCHEDULER_TOKEN` is present and sends that value only as `X-Receipt-Token`. It does not fall back to `SCHEDULER_TOKEN`. Scheduled and manual receipt-only GitHub steps expose only the scoped secret; other single-job steps expose only the general scheduler secret. The explicitly broad manual `all` operation retains general access and prefers the scoped receipt credential when configured.

The full backend suite passed 674 tests with four pre-existing SQLAlchemy `Query.get()` deprecation warnings. The scheduled-workflow YAML parsed successfully and `git diff --check` passed. Web candidate `a060351` was rechecked: 132 tests, scoped ESLint, TypeScript and the 15-page production build passed. Review found no blocking defect in the previously prepared date predicates, receipt endpoint authentication or Inbox copy candidate.

This is a local, unpushed candidate. The GitHub secret and matching backend environment value do not exist as verified configuration, the backend endpoint/caller changes are not deployed, and no receipt execution was triggered. Scheduler-independent aggregate execution evidence, independent monitoring, reviewed infrastructure/cost and at least 24 hours of cadence/recovery acceptance remain required before activation. Live backend remains `1673c14`; live web remains `d39ad2c`; Android source remains `9ed8a70` and device testing remains deferred.
