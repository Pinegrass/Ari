# Ari / Tomo implementation audit

13 September 2026. Engineering evidence review against the original programme brief, current source, independent repository histories, automated checks, and recorded browser/API/device observations. This is an internal audit, not an independent security certification. Historical tests and live observations are dated evidence, not fresh execution of every journey today.

## Executive assessment

Ari has progressed from a broad manual-first tracker into a more coherent capture → review → confirm → plan loop. Shared period reviews, explicit planning inputs, notification controls, Hindi foundations, privacy-conscious measurement and the approved no-card trial are implemented. The backend is deployed against the existing Supabase database. The Android internal release has passed targeted physical-device journeys.

The entire programme is **not complete**. Web implementation is ahead of its deployed version; store distribution and commercial activation remain blocked; real push outcomes, iPhone acceptance and comprehensive Hindi review remain unverified. Recurring prediction, comprehensive financial-life synthesis and demonstrated retention/willingness to pay remain product work. A recorded-ledger calculation is not a verified bank balance or guaranteed affordability forecast.

## Release and ownership ledger

| Surface | Audited source | Delivery / verification |
|---|---|---|
| Mobile before today's small fix | `5ba6d31614ee6ee93fa03cd3461ad210af181e2f`; documentation HEAD `5bcd1cd` | Android 1.3.0/code61, internal update `01a09995-993e-741b-9fff-f2e8c017a182`, confirmed on Samsung on 13 September |
| Backend | `c05a77ffa07b3ccd6a1edde49b0678ec0f52000d` | Railway deployment `14764053-885e-4299-a78b-8f17faf32068`; exact health revision and Supabase persistence verified 12 September |
| Authoritative nested web | `c10caca1b381d3d2cd351554f165b404c53f9242` | Local implementation/build verified; last verified live source remains `7d11e4f5d28a6defed8613a15123044a5c6e1663` |

Today's net-sign fix and its final publication/test identity are recorded in the addendum below. Backend and web have no tracked delta from the audited commits. Unrelated untracked files were preserved. A mobile commit does not include either nested repository.

## Implementations delivered

| Workstream | Substantive result | Evidence and limits |
|---|---|---|
| Reporting | One daily/weekly/monthly/quarterly/yearly engine; historical periods, comparable prior windows, Decimal totals, category changes, coverage, bounded evidence and next actions. Both clients consume the same contract. | `backend/reporting.py`, `backend/routes/reports.py`, `src/screens/PeriodicReportsScreen.tsx`, web `components/app/MoneyReview.tsx`. API and component tests; five empty periods exercised on emulator. Actual savings, historical bank balances and full obligation forecasts remain unknown. |
| Payday planning | User-confirmed cash, reserve, payday and dated obligations; explicit completeness; remaining amount and conservative per-day calculation. | `backend/routes/product.py`, both `usePlanning` hooks and planning screens. Currency/ledger changes and account-local midnight invalidate estimates; drafts survive failed save/retry. Physical Samsung failure/reconnect and calculation checks pass. No inferred income is treated as certain cash. |
| Capture and money correctness | INR paise preserved through keypad, create/edit, server validation and display; excess precision rejected. | Mobile `AddTransactionScreen.tsx`, locale utilities, backend locale/API tests, web money display. Live API persistence and Samsung 125.50 → 125.55 edit confirmed with disposable entries. |
| Offline reliability | Cached startup no longer waits for network validation; temporary sync errors retain retry eligibility, including recovery of previously exhausted transient failures. | Mobile auth/data/outbox changes, commit `f76cf7f`; emulator offline entry recovered as exactly one server entry. This is bounded evidence, not a long-duration multi-device soak test. |
| Navigation and correction | Home Transactions shortcut, list-first history with collapsed trends, ordinary Edit exposes confirmed deletion; report drilldown preserves its inclusive date range and can clear it. | Mobile `5ba6d31`; all corresponding Samsung journeys pass. |
| Android usability | Native planning date picker, inline validation and scroll to invalid fields; safe-area fixes for bottom actions; missing navigation translation startup crash fixed. | Planning/report/inbox/paywall screens; historical Samsung and emulator checks, including planning at 150% font scale. This does not establish app-wide accessibility compliance. |
| Tomo and inbox | Bounded context and missing-data instructions; English/Hindi input/context; generic updates inbox with retry, confirmed dismissal and historical report links. | Existing contextual chat improved, not created anew. Mobile `NudgeInboxScreen.tsx`, web inbox and backend coaching/nudge routes. Predictions and fully traceable proactive financial intelligence remain partial. |
| Nudge infrastructure | User-owned category/channel controls, quiet hours, frequency caps, deduplication, reservation before send, bounded receipt processing and deferred queue with expiry/revalidation. | `backend/jobs/nudge_policy.py`, `push_receipts.py`, `nudge_outbox.py`. Real PostgreSQL overlapping-worker check made one mocked provider call under quota. Automatic outbox remains gated off; provider acceptance is not proof of device display. Local reminders retain separate controls/budgets. |
| Measurement | Consented first-party allowlisted event counts; report actions, successful planning saves and trial starts wired; withdrawal deletes counts; export and 90-day count retention. Mobile analytics privacy hardened. | `backend/routes/product.py`, `jobs/product_maintenance.py`, client analytics/measurement modules. No raw properties accepted by count endpoint. Cohort dashboards and measured D1/D7/D30 improvement are not delivered outcomes. |
| Pricing and trial | Approved ₹149/month, ₹1,499/year definitions; server-authoritative, once-per-account 14-day no-card trial after a recorded entry; focus refresh and consistent trial entitlement. | `backend/routes/billing.py` and client trial/paywall flows. Trial exercised through UI and database. These definitions do not establish live store SKUs or successful paid checkout. No new payment-provider migration. |
| English/Hindi | Typed catalogs, fallback, persistence, language switching independent of currency, shared bilingual reports/previews, expanded core and accountant copy. | `src/i18n`, web language layer and backend evidence. English/Hindi switching exercised; full native-language, dynamic/legal/provider copy and accessibility review remain unfinished. |
| Website | Calmer homepage, clearer product explanation, labeled sample review, trust/data-rights links, FAQ, CTA hierarchy, responsive layouts, focus/skip/reduced-motion support and metadata. | Local English desktop/phone and Hindi phone browser checks recorded in `validation.md`. Canonical web source/build complete locally; redesign is not claimed live. No field-performance score measured. |
| Privacy and data boundaries | Mask during privacy hydration, analytics opt-out/filtering, generic push previews, authenticated ownership checks, server-only table access restrictions and cleanup/export support. | Source/tests and recorded migration/API checks. No full penetration test, backup restore drill or resolution of all existing database advisor warnings is claimed. |

## Latest defect corrected

Smart Ledger correctly computed income minus expense but called a magnitude-only display formatter. A deficit therefore appeared without its minus sign. The fix uses the existing sign-aware formatter with the account currency for the net summary. Private Mode still masks the value and now uses neutral net coloring so color does not disclose deficit/surplus. No transaction calculation, stored amount, API or schema changes are required.

Regression cases cover negative INR with paise, positive INR, zero, negative USD, and private positive/negative values using the actual PrivacyProvider. This screen change leaves other magnitude-formatting callers intact.

## Verification ledger

| Evidence date / scope | Result |
|---|---|
| 12 September, latest full implementation suites | Mobile: 50 suites / 534 tests; backend: 301 tests; web: 4 suites / 12 tests. Types, changed-source lint and web production build passed. These are historical full-suite counts, not today's rerun. |
| 12 September, deployed backend | 28 authenticated live checks including create/edit precision, reports, planning expiry and deletion. Direct read confirmed persistence in the named Supabase project; synthetic account/data cleanup verified. Health matched exact revision. |
| 13 September, installed Android update `01a09995` | Five targeted Samsung journeys passed: precise entry/edit; history/delete; planning dates/validation; offline draft/retry; daily report range/clear. QA entry and planning snapshot deleted, baseline restored, networks restored. |
| Earlier programme checks | Responsive local browser fixtures, English/Hindi layouts, isolated PostgreSQL migrations applied twice, row-lock concurrency with mocked provider, emulator offline/trial/privacy/font-scale journeys. See linked records for exact scope. |

No device testing is performed for today's small fix. Installation and physical acceptance of any newly published update must therefore be distinguished from the preceding verified Android version.

## Remaining work and acceptance criteria

| Priority | Gap | Closure evidence needed |
|---|---|---|
| Release | Web source is unpublished | Authorized deployment of canonical web commit, then authenticated browser → API checks for planning, reviews, consent, trial, English/Hindi and responsive states. |
| Release | Google Play v61 internal submission failed for service-account permissions | Correct release/upload permission or authorized Console upload; successful submission and tester installation of exact artifact. Existing edit/read access did not prove upload permission. |
| Commercial | BillDesk verification incomplete; catalog/RevenueCat offerings unavailable; real purchase/restore unverified | Owner/provider setup, correct SKUs, then purchase/restore/cancel/renewal/failure and backend entitlement reconciliation evidence. Pricing approval alone does not close this. |
| Reliability | Real notification display/receipts not established | Consented device delivery, receipt/token-rotation checks and preference/quiet-hour/dismissal integration before enabling outbox scheduling. |
| Acceptance | iPhone testing deferred by owner | Codemagic/TestFlight build and device acceptance when resumed. |
| Quality | Hindi and accessibility incomplete | Native-language copy audit, dynamic/legal/provider strings, Devanagari layouts, font scaling and screen-reader journeys across core screens. |
| Operations | Existing advisor warnings and recovery/retention assurance | Review existing function/search-path exposure and password protection settings; backup/restore evidence; operational cleanup scheduling and dedupe-ledger growth policy. No settings changes made by this audit. |
| Product | Full financial synthesis and defensible paid value remain partial | Confirmed recurring/payday suggestions, correction/evidence links and incomplete-history behavior, followed by consented user research and measured weekly return/value. Avoid claiming automated financial certainty. |
| Measurement | Retention/conversion outcomes not established | Validate event completeness, build cohort reporting, collect a sufficient consented pilot sample and assess renewal/churn. |

Recommended order: close release and payment verification, finish push/iOS/Hindi acceptance, then run the proposed user pilot before expanding forecasting or tightening paid restrictions. Preserve export, deletion, correction and privacy as basic trust capabilities.

## Supporting audit records

- Original programme findings, thesis, build/reject matrix and roadmap: [programme report](README.md).
- Research delivered: [competitor intelligence](competitor-intelligence.md), [monetisation and payment assessment](monetisation-and-payments.md). Research is dated; this turn did not recheck competitor prices or store policy.
- [Phase 2](phase-2.md), [Phase 3](phase-3.md), [validation](validation.md): historical foundation and test limitations.
- [Android completion](android-completion.md): migrations, trial/offline tests, artifact and failed Play submission.
- [Integration fixes](integration-fixes-2026-09-12.md), [usability fixes](usability-fixes-2026-09-12.md).
- [Backend deployment](backend-deployment-2026-09-12.md), [internal update](android-internal-update-2026-09-13.md), [Samsung regression](android-regression-2026-09-13.md).

Later dated evidence supersedes earlier “uncommitted”, “pending” or “not deployed” statements in historical reports. Private device images, financial values and credentials are excluded from this report.

## 13 September net-sign fix: final verification

Source: `0f70898880f93e25075b9ed7f3b0203593e21eaa`. Four focused Jest suites / 32 tests passed, including six new Smart Ledger cases; TypeScript and changed-source ESLint passed. The first cold test run exceeded the default one-second asynchronous query wait for the new screen's initial render; its bounded wait was adjusted and all cases reran successfully. No product failure was hidden by removing a test.

Runtime fingerprint independently regenerated with the configured EAS environment and matched installed v61: `f82b9c561785202f8057920d7a8a052d15c1ed33`. Android-only internal publication uses project `ae18eabf-124f-4b0a-a09e-a2a40dfb473b`, channel/branch `internal-release`, environment `production` for existing API configuration. This environment name does not mean the production update channel. The successful publication identity follows below. No new native build or device test.

Publication succeeded: Android update `01a09a28-cb33-785d-8ab3-61e14353ee89`, group `ea93b358-a687-4c4d-9ab6-a60d32c67317`, created `2026-09-13T09:45:59.859Z`, source `0f70898880f93e25075b9ed7f3b0203593e21eaa`. Compatible runtime confirmed in the publication result. **Published internally; installation and physical verification of this update remain unverified.** Previous physically verified update remains `01a09995`. Backend/web were not changed or redeployed.

