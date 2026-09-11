# Ari / Tomo product programme — decision and implementation record

11 September 2026. **Local implementation and research; not a production release or a completed 90-day programme.** See [validation](validation.md) for exactly what was exercised. Commercial choices below are proposals, not product configuration.

Next-phase implementation: [Phase 2 — updates inbox, push receipts and expanded Hindi coverage](phase-2.md). The original sections below describe the phase-1 foundation; phase-2 evidence and remaining work are recorded separately.

Latest implementation: [Phase 3 — deferred review notifications](phase-3.md), including PostgreSQL concurrency verification.

## A. Executive verdict

Ari is a capable manual-first money tracker with offline capture, budgets, accountant tools and contextual AI. Its breadth exceeds the clarity of its main user benefit. It does not yet have the verified balances, confirmed obligations or payday model needed to answer “what can I afford?” reliably. Calling recorded net cash flow “safe to spend” would break trust.

The strongest immediate improvement is a dependable loop: capture an entry, understand the period, correct missing information, choose one useful action. This programme implements a shared review engine, privacy and correctness fixes, notification policy, language foundations and a redesigned homepage. It does **not** claim product-market fit, a complete Hindi translation, full forecasting or verified store delivery.

## B. Current product audit

[Current-state audit](current-state.md) covers capabilities, partial work, broken flows, UX, architecture, instrumentation, monetisation, notifications, reporting and opportunities. Source, targeted regression tests and browser observations outrank inventories. The source survey covered principal auth/capture/sync/report/coaching/billing/data-rights paths; it is not an assertion that every line or every live integration was audited.

Baseline repos: mobile `4b4ae8e0a5139e3cfb3b61d80d9e4124f6cdb15c`; backend `1d5ba6bb8eb02da05fbbd910db36d7bbdc563bfe`; web initially `be5f32a`, advanced independently to `7d11e4f5d28a6defed8613a15123044a5c6e1663` by the concurrent release task. Programme changes remain uncommitted in each owning repo. A parent commit cannot capture backend/web work.

## C. Competitor intelligence

The dedicated research agent delivered [competitor intelligence](competitor-intelligence.md): all ten requested finance products, India-relevant products and adjacent habit/reporting examples. Tables distinguish official pricing/product evidence from limited review anecdotes. No review sample supports a numerical claim about market-wide complaints or retention. Prices and policies are dated observations, not contracted Ari terms.

Repeated lesson: reliable data and reduced effort earn trust; feature count and an AI label do not. Ari cannot win by copying YNAB's entire budgeting method, Monarch's household breadth, Rocket's bill services and an investment app simultaneously.

## D. Definitive competitive gap matrix

This source-verified matrix supersedes provisional Ari cells in the research workstream.

| Capability | Ari before → local result | Competitor practice | Gap / importance | Decision |
|---|---|---|---|---|
| Fast manual capture | Offline ledger, voice/text/manual already present; translated key capture copy | Money Manager efficiency; Copilot sample activation | Native timing and reconnect QA still required / P1 | Preserve and measure |
| Period synthesis | Daily/weekly/monthly partial → one five-period review contract and both clients | Monarch contextual recap | Full obligations and financial-life synthesis absent / P1 | Build shared engine, done locally |
| Affordability before payday | No trustworthy calculation → explicitly unknown | PocketGuard leftover; Simplifi capacity | Confirmed balance/payday/obligation inputs absent / P1 | Design next; do not invent a number |
| Transaction correctness | Prior release fixes already present; deficit/input bugs fixed here | Copilot review/correction loop | Physical-device regression remains / P0 | Fix, preserve single ledger |
| Contextual Tomo | Database-aware chat exists → stronger evidence/missing-data rules and Hindi request support | Contextual assistance tied to records | Broad claims still need evidence links and user correction / P1 | Bounded roadmap |
| Respectful alerts | Independent jobs → shared category/channel/quiet/frequency/dedupe policy | Simplifi controls | Receipts, deferred delivery and unified local/server budget absent / P2 | Foundation implemented |
| Hindi | Country formatting only → catalogs, persistence, core surfaces | Local-language access and currency fit | Secondary screens, provider UI and human QA remain / P3 | Continue migration; not complete |
| Weekly ritual | Reports/nudges existed without unified measurement → report/action semantics | Forgiving habits in adjacent products | Cohort dashboards and pilot data absent / P2 | Measure useful reviews |
| Annual review | Absent → yearly period engine, historical selection | Eligible personalized annual summaries | Narrative eligibility/coverage and sharing absent / P2/P3 | Reuse engine, defer spectacle |
| Household planning | Expense groups already exist | Shared budgets/partner visibility | Permissioned planning is a different substantial job / P4 | Defer expansion |
| Paid automation | Existing gates/providers; unchanged | Time saved earns recurring payment | Ari willingness-to-pay evidence missing | Research only |

## E. FEATURES WE SHOULD NOT BUILD

Do not add trading, investment recommendations, lending lead generation, tax filing, bill negotiation, a financial social feed, public savings rankings, spending streaks, four separate reporting stacks, lifetime unlimited AI, or an unsupported “safe” spending number. Do not hide export, deletion, correction, privacy or essential warnings behind a new paywall. Do not remove existing accountant/group/tax capabilities without owner review. The [research](competitor-intelligence.md) applies all five candidate gates: core promise, repeated use, measurable value, ability to execute better, and complexity.

## F. Differentiation thesis

**Proposed future thesis:** Ari turns fast money capture and confirmed commitments into an explainable view of what you can afford before payday, with Tomo pointing to the next useful action.

This is a recommendation for review, not a new shipped affordability promise. Today's defensible promise is narrower: understand your recorded everyday money with less administrative work. The homepage describes that existing job and retains Ari/Tomo identity.

A bank app shows activity in its own accounts. Ari can add user-confirmed context, manual cash spending, budgets and cross-period review. A spreadsheet can do most of the arithmetic for free. Ari deserves preference only if capture and interpretation take materially less effort and the answer remains traceable and correct. That advantage has not yet been demonstrated with user outcomes.

## G. Why would someone pay?

There is not yet a sufficiently evidenced reason for a broad audience to pay Ari every month. Generic AI answers and more charts are insufficient. A credible paid job is repeatedly saving the work of reconciling changes and anticipating known commitments, with few corrections and clear assumptions. Prove useful weekly returns and reduced effort before hardening the paywall.

Interview 12–15 target users, then run a consented four-week pilot. Observe their last real money decision, current workaround, time spent, corrections needed and whether they voluntarily return. Spending falling is not proof that Ari caused savings. Competitor subscription revenue is not proof of Indian willingness to pay for Ari.

## H–I. Free/Pro alternatives and pricing recommendation

The dedicated monetisation agent delivered [three models, entitlement proposal and commercial details](monetisation-and-payments.md).

| Proposal | Monthly / annual hypothesis | Paid job | Main concern |
|---|---|---|---|
| A — utility plus intelligence | ₹149 / ₹1,499; 16.16% annual discount | Reliable deeper reviews and editable scenarios | Accuracy, repeat use, AI economics |
| B — guided planning workspace | ₹99 / ₹999; 15.91% discount | Repeated structured planning | Differentiation from generous free utility |
| C — household plan | ₹249 / ₹2,499 per household; 16.37% discount | Shared commitments and coordination | Permissions, support and scope |

Recommend testing A after a useful first review, with an optional 14-day no-card preview as a hypothesis. Keep basic capture, correction, own history, privacy, export and deletion useful. Do not implement these prices, trial, restrictions or household scope without approval. The companion brief covers localized prices, tax assumptions, cancellation, grace, renewal recovery and restrained win-back. Existing subscriptions and existing provider code remain intact.

## J. Reporting status and architecture

Before: deterministic daily, rolling seven-day and month-to-date totals/timeline/comparison; separate weekly/monthly AI coaching; separate web/mobile P&L; no quarterly/yearly engine. That was partial reporting, not complete financial synthesis.

Implemented: `backend/reporting.py` supplies daily/weekly/monthly/quarterly/yearly boundaries, Decimal accumulation, period comparison and bilingual evidence. `/api/reports/periodic` adds `schemaVersion:2`, currency/language, category deltas, behavior, coverage and next-action fields while preserving old response keys. Mobile and web render the same API. Month/quarter/year complete periods compare with complete prior periods; partial periods compare equal elapsed days capped at the previous period end. Weekly remains rolling seven days for compatibility. Leap-year partial comparisons are elapsed-day comparisons, not matching calendar dates. Future dates and invalid period/month counts return 400.

Income, spending and signed recorded net flow are supported. Spending/income days and a disclosed large-expense heuristic are supported; the heuristic requires five expenses and flags amounts above three times the period median. It is not fraud detection. Categories are the existing top six; category changes include the union of categories across periods. Current goals are labeled current, never historical balances.

Balances, actual savings, safe-to-spend, payday and complete obligations are **unknown**, represented as null coverage fields. Legacy `savingsRate` remains for old clients and is an income-minus-expense ratio, not verified savings. No three-month discretionary trend, income regularity model, payday pressure forecast or automated annual story is claimed. This engine is reusable infrastructure and a useful recorded-ledger review, not the complete future report described in the brief.

The review has a correction/entry action, request failure/retry states, historical navigation, localized dates/money and mobile Private Mode. AI availability is not required. Future email or push can link to the same report identity; do not send financial content in lock-screen previews.

## K. Retention and nudge architecture

Existing event producers feed a common policy before Expo delivery. Authenticated preferences are user-owned; supported categories are reports, spending, recurring charges and optional check-ins. Push and in-app channels can be disabled. Default server cap is two pushes per rolling seven days and at most one per rolling 24 hours; quiet hours default 22:00–08:00 in the user's configured timezone. Equal start/end disables quiet hours. A maximum of zero disables server pushes.

`NotificationPreference` and `NudgeDelivery` persist settings and reservation outcomes. A locked user row serializes evaluation; a unique hashed user/event identity prevents duplicate sends. Reserve before sending. An uncertain network outcome consumes budget and is not blindly retried. Provider acceptance is not device delivery. Generic English/Hindi copy and minimal routing data replace AI/financial previews. Category and in-app settings also filter existing coaching/nudge endpoints. An authenticated, bounded inbox/dismiss API is available; a dedicated client inbox is not yet implemented.

This is a policy/dispatcher foundation, not a durable event bus. Existing scheduler producers remain. Quiet-hour suppression currently skips rather than reschedules. Receipt polling, retry ownership, expiration, pruning, durable outbox, priority arbitration, quarterly/yearly readiness jobs and cross-device local/server suppression remain. Local bill reminders and twice-weekly check-ins retain separate device controls and are explicitly labeled as such. Their combined volume is not covered by the server cap.

Future contract: event `{user, kind, source, evidenceVersion, occurredAt, expiresAt, dedupeKey, action}` → eligibility/freshness → preference/frequency policy → durable reservation → delivery adapter → accepted/delivered/opened/dismissed. Email remains an unconfigured future adapter requiring consent; no emails were sent.

Habit loop: report ready or a meaningful change → open review → understand one supported change → correct/add an entry or choose an action → next review becomes more useful. First session: one real capture and a bounded result. Activation: nonempty review plus a review action within seven days. First week: return to review/correct; weekly: compare recorded changes; monthly: reconcile missing entries; annual: coverage-aware review when sufficient history exists. No streak requires spending or daily attendance.

## L. Tomo intelligence roadmap

Tomo is more than decorative branding: it already reads bounded financial context and has deterministic answers and coaching jobs. It is not yet a trustworthy financial autopilot. This change improves missing-data honesty, evidence classes, Hindi context selection and grounded monthly-spend answers. Hindi quick prompts now send Hindi questions; both clients supply the language header. AI can still make mistakes; prompt rules are not a mathematical guarantee.

Next: give every computed insight stable evidence IDs and a correction action. Then propose recurring/payday candidates for confirmation, with amount/date ranges and provenance. Only after confirmation support a horizon calculation: verified available balances minus confirmed obligations minus explicitly chosen buffer, plus expected income shown separately with uncertainty. Exclude unknown accounts, avoid double-counted transfers, and show freshness. Recompute after edits, timezone changes and bill completion. Observed facts, calculations, predictions and AI explanation must remain separate through every client.

Do not infer guaranteed payday from one salary transaction or use predicted income to call money safe. Approval of the major thesis precedes presenting a new affordability product as Ari's positioning.

## M. Hindi and localisation

Implemented typed en/hi catalogs, English fallback, interpolation/plural helpers, per-device persistence, language switching independent of currency, browser language attribute, Devanagari fallbacks, localized review money/dates, bilingual backend evidence/previews, Hindi Tomo input/context, and catalogs for migrating legacy UI. Core labels across auth/onboarding/capture/transactions/budgets/Settings/Tomo are migrated. Local bill/check-in copy uses the saved language when scheduled. No user-authored merchant, note, goal or transaction text is automatically translated.

[String inventory](localisation-inventory.json) is generated by `scripts/audit-ui-strings.cjs` across mobile and web sources. It inventories static JSX and copy fields; dynamic strings, validation templates, legal prose and provider-hosted screens need separate review. It is a worklist, not a claim of translation coverage. **Hindi remains partial:** secondary accountant/tax/group/bank screens, some dynamic Settings/validation text, broader authenticated web screens and RevenueCat/store-hosted copy are not fully translated. Native Devanagari/font scaling and human linguistic QA are unverified. English is preserved. New languages extend the registry/catalog and provider controls; no currency conversion follows language selection.

## N. Website audit and changes

Before: competing download/open/signup/waitlist CTAs, abstract AI promise, sample financial UI not clearly labeled, weak explanation of data limits, no compact FAQ. Implemented a calm responsive homepage with one primary entry path, three-step product explanation, labeled illustrative review, specific trust/data-rights links, FAQs, optional product updates and Android availability link. It retains Ari's teal/cream/coral family and Tomo identity. No fabricated users, security certification, guaranteed savings, bank connectivity or live affordability claim.

English/Hindi desktop and phone layouts were inspected in the browser. Added skip link, visible focus/reduced-motion support, language controls, honest metadata, robots and sitemap. Waitlist network exceptions now recover and its input is legible on the light surface. Existing signup and authenticated functionality remain. No new photography or AI imagery was needed. No Lighthouse/Core Web Vitals claim is made; measure the deployed page under a real mobile connection before release. Hindi is client-selected, not a separate crawlable localized route yet.

## O. BillDesk versus Razorpay

See the [payment assessment](monetisation-and-payments.md) for method support, fees, settlement, refunds, disputes, webhooks, retries, invoicing, lifecycle and platform-specific policy sources. BillDesk approval and commercial terms need merchant-specific evidence. Razorpay is already integrated in this repository for web; the request's “do not integrate yet” is honored by making no new integration or migration.

Recommendation: preserve backend subscription/entitlement truth behind provider adapters. Web gateway payment → verified subscription state → entitlements. Native default remains approved store billing/RevenueCat; a web gateway's availability does not authorize in-app external checkout. India Android alternative billing requires applicable enrolment, disclosures, transaction reporting and residual store fees. Apple eligibility varies by storefront/program; do not add external purchase links without a separately checked policy path. Do not select a cheaper provider on headline transaction fees alone. No provider, payment, entitlement or plan mutation was performed here.

## P. Analytics and measurement

Mobile retains its existing PostHog facade; collection now fails closed when saved privacy state cannot load, automatic lifecycle capture/session replay are disabled, and a behavioral-property allowlist drops raw money, categories, arbitrary identifiers, demographics and free text. Explicit app events already exist. Added report action, language and notification preference semantics. Web has a provider-neutral consent-gated event boundary with **no configured transport**; its events are not claimed to be reaching a warehouse.

| Metric | Definition / source | Current state |
|---|---|---|
| Onboarding completion | Actual completion, separate from skip or consent | Existing completion events; false consent events removed |
| Activation | First nonempty review and review action within seven days of signup | Derive from named events; dashboard not built |
| D1/D7/D30 retention | Activated user performs meaningful capture/review/action on exact local day after activation | Semantics proposed; distinguish rolling retention |
| WAU/MAU | Unique users with meaningful event in rolling 7/30 days | Query from same event set |
| Report open/action | Successful report render; next-action click / opens | Instrumented on both clients; web transport disabled |
| Notification open | Existing `push_opened`; report by notification type | Provider acceptance cannot be the denominator for delivered-open rate |
| Insight interaction | Existing nudge open/dismiss and report action | No causal savings claims |
| Return frequency | Distinct meaningful days/sessions per activated cohort | Do not count background refresh as engagement |
| Trial/paid conversion | Server-verified trial start and paid entitlement, with cohorts | Await approved trial/model; never client checkout success |
| Renewal/churn | Verified renewal / subscriptions due; paid-through lapse for churn | Existing provider data needs reconciled reporting |
| Reactivation | Meaningful return after 30 inactive days | Proposed definition; avoid routine API last-seen |

Use pseudonymous account identity, schema version, event time, language, platform and allowed behavior codes only. Do not log chat, balances, merchant/category labels, receipts or descriptions. Exclude staff/test accounts and deduplicate retries. Agree timezone/day rules and cohort eligibility before creating dashboards. Notification suppression reasons can be operational counts without financial payloads.

## Q. Security and financial trust

Fixed: misleading positive deficits; report invalid-input 500s; sensitive server push/local bill previews; Home coaching leakage in Private Mode; fake onboarding consent telemetry; unsafe analytics hydration/metadata; stale price/trial copy. Ownership and report boundaries are regression-tested. New tables enable RLS and deny direct anon/authenticated grants; backend service access is intended.

JWT verification, SecureStore, ownership filters, provider webhook verification, rate limiting, export/deletion and PII filtering already exist. They are not proof of complete security. Remaining operational checks: production RLS and role grants, backups/restore drill, deletion through provider logs and backups, session revocation, secret rotation, retention, push receipt privacy and full cross-device account isolation. The disposable migration test proves schema behavior, not production readiness. No secrets or real financial records are included in programme artifacts.

## R. Changes implemented

- Backend: `reporting.py`, `routes/reports.py`, `routes/tomo.py`; `jobs/nudge_policy.py`, shared `jobs/push.py`, preference/delivery models, engagement/coaching endpoints, SQL migration and tests.
- Mobile: typed i18n catalogs/context, core screen copy and language controls; report API/UI; notification preference API/UI; Private Mode card protection; neutral local reminders; analytics filtering and tests.
- Web: new homepage/CSS, language provider/catalogs, report component/API, Settings preferences, P&L direction correction, auth/Google copy, waitlist recovery, analytics boundary, metadata/robots/sitemap and tests.
- Documentation: source audit, competitor research, commercial/payment brief, string inventory, programme decision record and validation.

Temporary synthetic browser routes were removed. Existing user/release edits were preserved. No commits, pushes, deployments, OTA, native builds, purchases or production migrations belong to this programme.

## S. Remaining technical debt and release gates

The work is reviewable local implementation, not a completed full-product rebuild. Highest remaining work: complete Hindi migration and human/native QA; confirm user-data completeness before affordability; unify local/server notification budgets; receipt/outbox/retry lifecycle; live staging migration and provider tests; report performance on very large histories; event pipeline/cohort dashboards; referenceable insight evidence; legal/provider copy review; physical mobile accessibility/offline notification checks. Existing P&L/other screens still use legacy savings terminology and separate calculations; replacement must preserve capabilities and happen deliberately.

Release sequence: capture all three exact commits; backup/staging migration and least-privilege checks; deploy backend before preference clients; exercise auth, API, null nudge response, report language, billing and entitlement contracts; verify clients against staging; then follow each repository's release workflow. Old clients may not understand a null opted-out nudge; validate supported versions before changing a real account's setting. Failure to load preferences offers retry and does not overwrite stored choices. Do not blend these uncommitted changes into the concurrent release candidate.

## T. Next 30/60/90 days

| Horizon | Deliverable | Evidence needed to proceed |
|---|---|---|
| 0–30 days | Finish translation, staging/native QA and reviewed release of this foundation; interview/pilot users; establish event data quality | No cross-account leakage, correct period totals, consent/privacy checks, useful review returns and measured correction burden |
| 31–60 days | Confirmed payday/obligation model and evidence-linked insights; durable nudge outbox/receipts; evaluate affordability prototype privately | Confirmations, freshness, missing-account behavior, transfer/currency correctness, no false safety claims |
| 61–90 days | Evaluate approved Pro hypothesis and actual willingness to pay; cohort/renewal dashboard; annual narrative only for eligible records | Repeat value, viable support/inference economics, verified billing recovery and owner approval of model/price/trial/provider path |

These are sequenced experiments, not date-based permission to ship. If review usefulness is weak, improve capture/context rather than add features. Owner review is requested only for the concrete commercial and major-positioning proposals; code release remains a separate workflow.
