# Durable Decisions
## DEC-001 — Independent mobile, web and backend repositories
Status: ACCEPTED
Date: unknown

Decision: Mobile, web and backend retain independent Git histories and deployments.

Reason: Current workspace/remotes implement this split.

Consequences: Cross-surface releases require three checkpoints and contract verification.

Do not revisit unless: migration preserves deployability and history.

## DEC-002 — Razorpay is the web payment rail
Status: ACCEPTED
Date: 2026-09-02

Decision: Web subscriptions use Razorpay; entitlement reconciliation remains server-controlled.

Reason: Current web/backend code and handoff commits.

Consequences: Never trust client-only payment success.

Do not revisit unless: billing migration includes webhook and entitlement transitions.

## DEC-003 — Isolated internal release verification
Status: ACCEPTED
Date: 2026-09-11

Decision: Android verification uses internal-release channel and Play internal track. iOS uses the existing Codemagic signing integration and TestFlight-only publication. Candidate source comes from exact commits or isolated worktrees when shared repositories contain concurrent work.

Reason: An old production OTA can obscure candidate evidence; shared product edits and stale Git-triggered deployment source must not enter a verified release accidentally.

Consequences: Record Android and iOS source commits separately, preserve all signing private keys, and require device retest before internal rollout. No public review or OTA publication in this task.

## DEC-004 — Evidence-bounded reviews and programme commercial boundary
Status: IMPLEMENTED LOCALLY / COMMERCIAL PROPOSALS PENDING OWNER REVIEW
Date: 2026-09-11

Decision: Reuse one five-period recorded-ledger report engine across clients. Unknown balances, actual savings, obligations and affordability remain null; language does not change currency. Server nudges use a shared privacy/frequency/preference policy with durable reservation. No new price, trial, entitlement restriction, payment migration or major positioning is approved by this code work.

Evidence: docs/product-programme-2026-09/README.md and validation.md. Hindi is partial; full translation/native QA, staging rollout and a durable delivery lifecycle remain. These dirty working trees must not enter the separate release candidate.

## DEC-005 — Receipt evidence and token rotation
Status: IMPLEMENTED LOCALLY, LIVE DELIVERY UNVERIFIED
Date: 2026-09-11

Receipt polling may retry reads but must never resend an ambiguous notification. Provider-delivered means provider handoff, not a device display/read. Receipt errors can clear only the token actually used for that send; newly registered tokens survive late failures. Clear terminal receipt metadata while retaining deduplication identity. Quiet-hour suppression is not deferred delivery; an outbox is still needed. Evidence: docs/product-programme-2026-09/phase-2.md.

## DEC-006 — Defer only fresh-enough, known-unsent notifications
Status: IMPLEMENTED LOCALLY / STAGING UNVERIFIED
Date: 2026-09-11

Quiet-hour review and recurring-charge events may queue for up to 24 hours, with current preferences, token, quota and source-dismissal checks before reservation. Time-sensitive budget alerts and reactivation stages require additional freshness rules and remain suppressed. A reserved/unknown send is never returned to the queue. Queue routing/source metadata is cleared on completion; deduplication tombstones remain. Attempt time drives delivery quota and receipt age. PostgreSQL overlapping-worker test confirms one send and the per-user limit in the synthetic scenario. Evidence: docs/product-programme-2026-09/phase-3.md.


## DEC-007 — Approved commercial offer and Android priority
Status: APPROVED / BACKEND LIVE / ANDROID VERIFIED / PLAY UPLOAD BLOCKED
Date:2026-09-11

Owner approved ₹149/month, ₹1,499/year and14-day no-card trial after experiencing value; eligibility is the first recorded entry, one trial per account, no automatic charge. This supersedes DEC-004 commercial hold. Owner authorised phone use, then explicitly deferred iPhone testing to Codemagic/later and prioritised Android. BillDesk remains incomplete. Android verification uses the final product candidate on internal-release; v58-v60 are superseded after physical QA defects. New automatic outbox sends stay behind NUDGE_OUTBOX_ENABLED until real delivery verification.


## 2026-09-12 — INR minor units and draft preservation

The approved device pain-point fixes supersede the earlier whole-rupee entry restriction: INR accepts and displays up to two decimals across mobile/server/web. Deploy backend acceptance before releasing the keypad change. Draft edits survive load/save failures; operation retries must not replace a draft with saved inputs. Report drilldowns carry inclusive dates. Native date selection reuses the installed datetimepicker dependency to preserve the current native runtime.
