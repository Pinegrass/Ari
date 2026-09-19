# Original programme deliverables and remaining gaps — updated 20 September 2026

Evidence inventory against the owner's original attachment `pasted-text.txt`
(attachment fe9b2d6d-3a25-45a2-af02-f7063b14e146). This document distinguishes an
existing written deliverable, implemented source, released artifacts and demonstrated
user outcomes. None is a substitute for the others. Paths below are relative to the
Ari repository unless shown as sibling filenames within this documentation directory.

The programme README contains the original A–T response. It is a dated phase-1 record:
its statements about approvals, unpublished status, missing planning, old notification
caps and absent analytics must not override later source or release evidence. Current
implementation is substantially further along, but the original programme is not fully
accepted. Root's current implementation report owns exact final commits and test totals.

## A–T deliverable map

| Original deliverable | Concrete evidence | Current conclusion and remaining work |
|---|---|---|
| A. Executive verdict | `README.md` §A/F/G; `implementation-audit-2026-09-13.md`; this map | Written verdict exists. Ari offers fast capture, confirmed planning and increasingly explainable reviews. Repeat value and willingness to pay remain unproven by a real pilot. |
| B. Current product audit | `current-state.md`, `integration-review-2026-09-12.md`, `implementation-audit-2026-09-13.md`, root `.ai/20-CURRENT-STATE.md` | Source/journey audits exist. Do not claim every source line, provider integration or current build has been tested. Latest three-surface acceptance remains distinct from earlier Android/live checks. |
| C. Competitor intelligence | `competitor-intelligence.md` | Dedicated research covers ten requested finance products, India-relevant and adjacent examples with sources and dated prices. Representative app-store complaint frequencies, actual competitor delivery and population retention were not measured. Refresh research before a new commercial decision; no market-wide claim follows from anecdotes. |
| D. Competitive gap matrix | `README.md` §D | Capability/build-reject matrix delivered. Older “absent” cells for planning, receipts and analytics are historical; later evidence below supersedes those cells. Outcome priorities still need pilot validation. |
| E. Features not to build | `README.md` §E; `competitor-intelligence.md` | Explicit exclusions delivered: no speculative trading/advice, lending leads, bill-negotiation business, public rankings or four unrelated report stacks. No need to implement rejected scope to close the programme. |
| F. Differentiation thesis | `README.md` §F | Clear proposed sentence: capture plus confirmed commitments produces explainable pre-payday affordability. Recorded data/confirmed inputs remain distinct from verified bank balances. Major repositioning is not implicitly approved by engineering work. |
| G. Why someone would pay | `README.md` §G; `monetisation-and-payments.md` | Honest paid-value hypothesis documented. Interviews, voluntary return, correction burden and demonstrated time saved remain missing user evidence. |
| H. Free vs Pro proposals | `monetisation-and-payments.md` three models and entitlement matrix | Written alternatives exist. Owner approved price/trial, not blanket permission for every proposed restriction or household scope. Final unapproved entitlement changes remain a product decision, not a reason to stall independent engineering. |
| I. Pricing recommendation | `monetisation-and-payments.md`; root `.ai/STATE.yaml`; `backend/routes/billing.py` | ₹149/month, ₹1,499/year and a 14-day no-card trial approved in conversation. Store catalogue, taxes/checkout terms and real lifecycle evidence remain external/operational acceptance. Price approval does not prove willingness to pay. |
| J. Reporting status | `README.md` §J; `backend/reporting.py`, `backend/routes/reports.py`, `src/screens/PeriodicReportsScreen.tsx`; `intelligence-evidence-2026-09-19.md` | Shared daily/weekly/monthly/quarterly/yearly report engine, comparisons, coverage, source correction, fresh confirmed-plan context and conservative history baselines implemented. Verified opening/closing balances, actual savings and historical safe-to-spend movement are not available from incomplete manual records. Automated annual narrative/sharing and larger-history performance acceptance remain separate work. |
| K. Retention/nudge architecture | `daily-nudges-2026-09-13.md`, `phase-2.md`, `phase-3.md`, `notification-channel-audit-2026-09-14.md`; `backend/jobs/nudge_policy.py`, `nudge_outbox.py`, `daily_nudges.py` | Preferences, quiet hours, frequency budgets, inbox/dismissal, reservation/dedupe, receipts and three daily opportunities implemented. Daily/outbox sending remains off. Real delivery, receipt/tap behavior and combined local/server notification budgeting remain open. Not every example trigger in the original brief has a producer. Email delivery is not implemented or activated. |
| L. Tomo intelligence roadmap | `README.md` §L; `intelligence-evidence-2026-09-19.md`; `backend/routes/tomo.py`; `src/screens/TomoScreen.tsx`, web `components/app/TomoChat.tsx` | Corrected context interpolation, bounded owner context, source metadata, source review/correction and monthly recurring/payday suggestions implemented. Predictions require explicit confirmation. Source provenance is not verification of every AI sentence. Broad forecasting, all recurring frequencies and automated interpretation evaluation remain gaps. |
| M. Hindi/localisation | `localisation-inventory.json`; `src/i18n/`, `aritomo-web/lib/i18n/`; report/intelligence copy and auth error modules | Reusable English/Hindi framework, core copy, reports, settings/auth and new intelligence strings exist. Full secondary accountant/tax/group/bank coverage, dynamic errors, provider-hosted screens, human Hindi review and native Devanagari/font-scale acceptance remain incomplete. Inventory counts are not proof of translation quality. |
| N. Website audit/redesign | `README.md` §N; `validation.md`; `aritomo-web/app/page.tsx`; auth/UI components; `coordinated-release-2026-09-13.md` | Calm homepage, hierarchy, FAQs, labels, data-rights links, language controls and responsive checks delivered. Latest authenticated editing/analytics/callback flows still need acceptance against their released backend; accessibility/performance audits across every state are not complete. |
| O. BillDesk/Razorpay assessment | `monetisation-and-payments.md` payment/platform matrix and architecture | Recommendation delivered. BillDesk verification remains incomplete; no new Razorpay migration is authorized by general “complete” instructions. Play permissions, catalogue/RevenueCat configuration and real purchase/restore/refund/renewal evidence remain required. Existing provider code is not proof of current payment readiness. |
| P. Measurement plan | `measurement-v2-contract.md`; `backend/measurement_v2.py`, `measurement_cohorts.py`, versioned routes/migration; mobile/web measurement session helpers; isolated PostgreSQL verifier | V2 consent epochs, bounded retry dedupe, exclusion, withdrawal/export/expiry, server-confirmed action instrumentation and internal aggregate report implemented locally. D1/D7/D30, completed-day WAU/MAU and return-frequency distributions are computable. Frequency buckets count distinct meaningful local active days over7/30 completed dates, include inactive current consented accounts in the denominator, and disclose recent opt-ins without tenure normalization. Trial starts and event counts are not full conversion funnels. Notification attribution, verified paid lifecycle metrics, onboarding funnel completeness and mature elapsed cohorts remain gaps. |
| Q. Security findings | `README.md` §Q; `helper-hardening-2026-09-19.md`; backend account-deletion tests; `operations-runbook.md` | Ownership/consent tests, sanitized failures, session revocation before deletion, exact-event expiry, restricted migration tables and function hardening candidate exist. Reviewed migrations still need authorized production application/advisors. Backup restore, provider leaked-password protection, broad live session/isolation and deletion across backups remain open. |
| R. Changes implemented | `implementation-audit-2026-09-13.md`, `intelligence-evidence-2026-09-19.md`, root's current completion report; owning repository diffs | Substantive source changes span all three independent repositories. Parent commits do not capture nested backend/web changes. Record source revisions, migrations and release artifacts separately; local tests are not deployment. |
| S. Technical debt | This map; `.ai/sprints.yaml`; `operations-runbook.md`; `notification-channel-audit-2026-09-14.md` | Engineering gaps and external acceptance gates are explicitly separated below. This is not a completion certificate. |
| T. 30/60/90 roadmap | `README.md` §T; `.ai/SPRINT-ORCHESTRATION.md`; `.ai/sprints.yaml` | Sequenced roadmap exists; dates are planning horizons, not elapsed user evidence. Complete independent engineering, release/accept candidates, then observe useful returns and paid lifecycle before further expansion. |

## Original sections and implementation scope

Sections 1–3 (product awareness, thesis, research) have written/source-grounded evidence,
but do not constitute exhaustive live integration certification. Sections 4–5 have
shared reports, confirmed inputs and more traceable intelligence; they do not have
verified bank balances or guaranteed AI correctness. Sections 6–7 have substantial
notification and consented measurement architecture, while actual attribution/funnel
coverage and delivered habit outcomes remain incomplete. Sections 8–9 have reusable
localisation and redesigned web surfaces, while full Hindi/accessibility/performance
acceptance remains incomplete. Sections 10–11 have research and the later approved
price/trial decision; provider migration and all proposed entitlement restrictions are
not thereby approved. Section12 security has concrete improvements and remaining
operational gates. Sections13–16 require continued prioritised implementation and actual
validation, not a claim that every test type was run on every surface.

## 20 September coding closure and scope boundaries

The historical A–T rows above describe the earlier checkpoint. For current source and validation, use `completion-audit-2026-09-20.md` and its linked lane reports. This continuation implemented notification-owned attribution and mature post-open action association, consented ordered funnels and paid lifecycle windows, generic notification ownership, secondary Hindi/error states, bounded multi-phase maintenance/streaming reports, five-cadence recurrence and confirmed horizons, parser validation, account-isolated bills, immutable group currency and settlement retry safety.

Remaining limitations must not be hidden behind an implementation label:

- Full signup/onboarding population metrics are unavailable without pre-consent collection; current consented observation funnels are explicit. Net paid churn, revenue/refunds and annual-history gaps are not guessed from incomplete webhooks.
- Bill reminders remain separate from the server quota. Older/offline clients require refresh after a compatible update; real combined device experience remains unverified.
- Tombstones are retained pending evidence of a safe replay horizon. Production query plans, restored backups and alert delivery require operational verification.
- Human/native language/accessibility and released performance remain acceptance work. App-owned source copy is not a translation of provider-hosted screens or arbitrary AI/user text; English/Hindi legal bodies are implemented as drafts pending publication review.
- Conservative bounded predictions and deterministic/parser regression tests do not verify every generated AI sentence or establish unknown bank balances. Broad unconstrained forecasting is deliberately unavailable when evidence cannot support it.

## External, owner-deferred, release or elapsed-time gates

- Android device acceptance remains owner-paused; iPhone separately deferred. Do not
  silently resume either through orchestration.
- Actual notification delivery, receipt, cold/warm tap routing and preferences need
  provider/device evidence before automatic daily/outbox activation.
- BillDesk verification, Play upload permission, store catalogue/RevenueCat and real
  payment lifecycle require external/configuration/account evidence.
- Reviewed local backend/web/mobile candidates require the repository release workflow,
  migration ordering, exact artifact recording and post-release acceptance. The monitoring
  workflow additionally requires the exact approved live revision variable.
- Supabase leaked-password protection and production function advisor closure require
  approved provider/deployment work; local hardening cannot change their live status.
- Real pilot recruitment/outreach is not inferred permission to contact people. D30,
  renewals, sustained habit and willingness to pay require actual elapsed observations.

This map intentionally leaves incomplete engineering visible. External gates explain
specific acceptance delays; they do not excuse stopping all independent implementation.
