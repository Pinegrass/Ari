# Browser and scheduler acceptance — 24 September 2026

No release was performed. Live backend remains `1673c1479a1dc9c579a94af5b2cd6cdfb61154aa`; live web remains `d39ad2c5607357c87432ada9ed327c58f3fdfc0a` / Vercel `dpl_5QkwZBza1UPEVEtoXdXJqoncNp6J`. Android app source remains `9ed8a704e3904c71b4ce1cbcb8604a7a4c634985`; root documentation baseline was `8fb995e`.

## Browser acceptance closed

On the public `aritomo.in` deployment, a fresh disposable account successfully signed in. A full page reload in Hindi reached the populated dashboard without Retry, with zero recorded income/spending and the Hindi deterministic fallback title, message and action prompt. Switching to English and fully reloading also reached the dashboard without Retry and displayed the English fallback. This closes the previously interrupted cold-reload and empty-account Hindi fallback checks. It does not certify every nudge branch, arbitrary AI text, mature histories, narrow layouts or native accessibility.

The fixture was globally signed out and deleted through the existing exact-identity cleanup script; Auth absence and application-table cascades passed. The private credential manifest was removed and the browser tab closed. Aggregate cleanup evidence: `D:/Codex/Artifacts/Ari/browser-fixture-lifecycle-2026-09-20.json`. No existing user records were changed, no physical devices accessed, and no push/content job was triggered.

The empty-account UI exposed a small copy defect: the Inbox badge counts coaching cards as well as transactions, but Hindi called the two introductory cards “2 entries.” English also implied every item was month-bound. A local one-line candidate now says “items in your inbox” / “इस सूची में … आइटम.” This candidate is not deployed and does not change the counter or financial data.

## Scheduler reliability remains open

A bounded independent agent inspected workflow source and actual step completion. Root reviewed the workflow and the latest failed readiness output. Receipt cron is `17,47 * * * *`; acceptance remains 120 minutes.

| Run | UTC on 23 September | Evidence |
| --- | --- | --- |
| `35891197530` readiness | 16:48:05 | Receipt age 186.5 minutes; prior failure |
| `35914460602` readiness | 20:14:11 | Receipt age 135.4 minutes; health, exact revision and maintenance passed |
| `35868834525` receipts | 13:41:38 | Successful receipt step |
| `35899293292` receipts | 17:58:47 | Successful receipt step |
| `35923229716` receipts | 21:34:02 | HTTP 200; all receipt counters zero |

The two observed receipt execution gaps were 257.15 and 215.25 minutes. Sampled jobs executed within seconds of run creation, placing the observed gap before job execution. This does not establish whether GitHub delayed or dropped triggers, or its internal cause. Green workflow `35931274488` at 22:59:28 ran no receipt/business step and is not receipt evidence. The readiness schedule itself was also sparse despite its hourly configuration.

Do not relax the freshness threshold, infer delivery from zero-count success, or rerun sending jobs. There is no demonstrated application defect here to patch speculatively. A dedicated receipt scheduler and independently scheduled read-only monitor are an operational candidate requiring a reviewed deployment plan, credentials scoped to the specific operation, cost assessment, rollback and actual cadence/recovery acceptance before activation. No new infrastructure, permission or spending was authorized by this heartbeat.

## Acceptance boundary

Notification delivery/tap/receipt and combined-channel device acceptance remain deferred, with daily/outbox gates unchanged and disabled. BillDesk, Play/store permissions and real purchase lifecycle, human Hindi/legal/native accessibility review, representative load/query plans, external alert receipt/recovery, full infrastructure restoration and elapsed consented pilot remain open. No sprint was newly declared fully accepted; orchestration remains active.

Local wording candidate: `a0603515ea3895596d98fc63faaa10654f71e6bc`. Scoped ESLint and `git diff --check` passed. No behavior changes or new unit tests were needed for this copy-only change. Prior 132 web / 642 backend tests remain evidence for the deployed commits; they were not rerun unchanged.
