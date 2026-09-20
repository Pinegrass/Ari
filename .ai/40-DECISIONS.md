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

## 13 September 2026 — signed ledger display

Smart Ledger net uses the existing sign-aware currency formatter with account locale; magnitude formatting elsewhere is unchanged. Private Mode masks the net and uses neutral coloring. Audits distinguish source, publication and physical acceptance; historical full-suite results are not presented as freshly rerun checks.

## 13 September 2026 — daily Home hierarchy

Owner approved calm daily Home rather than making unconfirmed affordability its headline. Use a single daily-spending hero with monthly context, compact planning access, one existing nudge, recent entries and a reports link. Keep bottom + primary and first-entry CTA for empty history. Hide routine habit/chart/coaching stacks from Home. Do not label recorded net as actual savings. Implementation approval does not alone trigger another publication.

## 13 September 2026 — three daily nudge opportunities

Owner requested3daily nudges. Use9AM/2PM/7PM notification-timezone windows, eligible actions only, no missed-slot catch-up. Cap all server push attempts at3perlocalday and default21perrollingweek; retain saved lower caps and opt-outs. Slot/candidate dedupe and acknowledged24-hour dismissals apply. Local device reminders retain separate controls. No live activation inferred from implementation request; verify real delivery and concurrency before enabling new gates.

## 2026-09-13 — coordinated rollout
Owner request to complete next item authorizes the previously proposed coordinated release. Backend and web production plus Android internal OTA published; automatic daily delivery remains disabled until real delivery/receipts and daily PostgreSQL concurrency acceptance.

## 2026-09-14 — sprint orchestration and device hold
Owner authorized agent orchestration across all sprints. Root remains accountable, with bounded agents and a four-hour task heartbeat. Implemented/released/verified/accepted states remain separate. Owner explicitly left device testing pending; future runs must not use devices until resumed. External billing/Play gates do not block independent engineering.

## 2026-09-14 — operational acceptance evidence
A successful scheduled workflow is insufficient: verify actual job step and HTTP outcome. Zero-count maintenance/receipt runs prove connectivity only. Local check-ins/bills are outside the server nudge cap; document this before activation and preserve user-created reminders.

## 2026-09-14 — scheduler failures and measurement versioning
HTTP200 does not establish per-user batch success. Runner logs must avoid raw identifiers/provider errors; policy skips are not failures and uncertain work is not retried. Legacy UTC measurement counts must not be relabeled as local-day cohorts; versioned ingestion/consent design precedes reporting.

## 2026-09-15 — reference before ingestion
Validate S6 local-day/maturity/exclusion calculations independently before additive schema work. Treat already consent-scoped current episode snapshots as a strict reference input; do not adapt legacy UTC counts or claim epoch/transport acceptance from pure fixtures.

## 2026-09-15 — retention boundary and auth error privacy
Legacy date-only counts expire conservatively including UTCtoday−90 at maintenance execution; do not claim exact continuous enforcement. Auth UI renders allowlisted localized messages, never arbitrary provider/API/URL descriptions. Password recovery guidance must not assume one provider minimum policy.

## 15 September — shared legacy expiry
Maintenance and ingestion use one conservative UTC90-day boundary; this does not guarantee continuous physical purge. S6 review records that deleted UUID receipts cannot support indefinite retry recognition. No new longer-lived identifier retention policy or production v2 schema was introduced.

## 19 September — measured population
Reference active counts describe recent activation cohorts only. Preserve explicit scope and mark product-wide WAU/MAU unavailable until separately implemented; no inference from recent-cohort counts.

## 19 September — integrated measurement and intelligence

V2 collection requires explicit consent and a memory-only epoch on both clients. Legacy consent is not promoted. Receipt UUID dedupe is bounded to90days; no durable analytics retry queue. Exact event/activation timestamps expire, while minimal current-consent epoch/timezone/activation-expired state prevents stale requests and false reactivation until withdrawal. Account exclusion purges analytics and removal does not opt in. Reports separately label recent activation cohorts and current-consented product-wide activity; notification attribution and paid outcomes remain unavailable.

Historical comparisons use recorded data only, preserve missing months as unknown and expose source groups/correction routes. Recurring/payday predictions require explicit confirmation and do not become confirmed balances or planning inputs automatically. Tomo context provenance is not verification of generated claims. No per-entry currency or FX conversion is invented.

Database helper hardening preserves authenticated group RLS and trigger behavior while constraining caller identity/search paths and direct function execution. New server-only measurement tables intentionally have no client policies. Apply additive measurement schema before backend code; source tests do not authorize or certify live migrations. Read-only monitoring needs an exact deployed SHA and actual job-step timestamps, not workflow-green status alone.

## 19 September — planning retry and account boundaries

Planning confirmation/deletion use business operation UUIDs and expected snapshot revisions independently of analytics consent. An unchanged retry cannot refresh a plan against newer ledger data; an old request cannot overwrite a newer confirmation. Deletion removes financial inputs/fingerprint/ledger data, retaining only a random revision/deleted marker to reject resurrection; export hides deleted plans and account deletion cascades the marker. Legacy request compatibility remains, without the new-client retry guarantee. Cross-account API retries must fail closed rather than acquire the next user's token.

## 19 September — bounded v2 cleanup transactions

Measurement expiry selects100 accounts per keyset page and commits between internal HTTP pages. Preserve the shared user-lock order; tolerate accounts deleted after selection and advance using selected IDs. Do not skip locked accounts silently. Scheduler summaries contain counts, not cursors, and ambiguous requests are not retried. New runner must precede/accompany backend rollout because old runners stop at one page. This bounds account locks only; global legacy/delivery cleanup and report scale remain open.


## 20 September — coding closure, provenance and release boundaries

Verified billing state is maintained separately for each provider; unknown historical provenance preserves existing valid paid access until real reconciliation establishes ownership. Billing issues do not create a guessed grace period. Current-consent lifecycle observations use opaque epoch-scoped subscription references and expire within 90 days; annual baselines may disappear. Missing webhooks are unknown, cancellation is not refund/churn, and observed-window fractions are not subscriber census or causal lift.

Three daily opportunities remain the server generic channel policy when deliberately enabled. Updated clients query authenticated ownership before scheduling local generic check-ins; bill reminders remain separate. Legacy/offline clients and real OS/provider behavior require acceptance. All automatic sending gates remain off.

Local bills require verified account binding and account-specific storage. Historical unowned data is preserved separately; do not guess its owner. Financial screen state resets across accounts. Confirmed account deletion may clean the captured deleted account's local bills even after session transition, but must not expose its response or log out a new account. Ambiguous deletion is not automatically replayed.

Groups use an immutable recorded currency. Historical NULL needs explicit creator confirmation without converting amounts. Group writes require captured currency, so older clients receive a conflict until upgraded. New expense UUID retry safety requires backend-first release. UPI launch is not payment evidence; settlement records only explicitly confirmed exact splits.

Structured/parser and recorded-data calculations have synthetic regression evidence; freeform AI prose remains labelled interpretation with unverified claims. Do not turn manual net cash flow into actual savings/bank balance. Legal/data-handling copy changes are unpublished factual drafts, not legal compliance certification. Device hold, no new release authority and independent repository records persist.

## 20 September — owner-authorized release continuation

After the remaining-work report, owner said “Go ahead, do the pending works.” Proceed with reviewed schema, backend/runner, compatible internal Android and web release/operational verification. This does not resume physical Android/iPhone testing, broad notifications, store spending or outreach. Existing price/trial approval persists.

Private consistent public/auth backup restored successfully before production migrations; preserve the protected dump outside Git. Seven migrations applied with explicit local-to-remote version mapping in release-continuation-2026-09-20.md. Do not replay timestamp-different migration files.

Release smoke identified two production-only account deletion gaps: consumed invite recipient FK needed SET NULL while retaining used_at, and provider string identity needed normalization against PostgreSQL UUID. Both fixes have regression/live evidence. Do not infer live correctness solely from SQLite tests.

Restore drifted native dependencies from verified lockfile artifacts and recompute fingerprint; never override runtime compatibility. Root master pushes automatically request paid native preview builds, so this OTA continuation does not push root master merely to archive source. Backend runner/code pushes and per-deployment Railway approvals are authorized; no permission expansion was made.

Web public-domain promotion awaits missing registered business address/contact confirmation. Supabase leaked-password protection awaits dashboard sign-in; database connector access alone does not supply auth-setting capability. Questions are already pending; do not repeatedly ask. No direct external alert/outreach message is authorized. The hourly readiness workflow is active, while actual alert receipt/recovery remains a separate gate.
