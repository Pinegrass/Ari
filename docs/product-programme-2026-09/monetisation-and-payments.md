# Ari / Tomo monetisation and payment decision brief

Research date: 11 September 2026. **Recommendation only; no prices, trials, entitlements, provider integration or migration changed.** Prices below are hypotheses for owner approval, not validated willingness to pay. Public sources establish capabilities and policy, not Ari's contracted terms, account approvals or production readiness.

## Existing truth

The programme's instruction “do not integrate Razorpay yet” differs from source reality: `backend/routes/billing.py` already owns Razorpay plans/subscription creation/webhooks and now contains local `/verify` and Razorpay reconciliation work. Preserve that pre-existing work. The source plan definitions are Pilot ₹99/month, Pro ₹129/month and Family ₹249/month. The canonical web `components/app/ProUpsell.tsx` already presents these choices. Mobile `src/lib/revenuecat.ts` uses store-specific RevenueCat keys and the `Ari Finance Pro` entitlement; `src/api/billing.ts` calls backend reconciliation.

The root agent recorded starting HEADs mobile `4b4ae8e`, backend `1d5ba6b`, web `be5f32a`, with local changes. These differ from the older continuity pack. Historical live inspection reported Razorpay unconfigured and RevenueCat server credentials absent. Local repair code does not establish deployed behavior. Current provider activation, BillDesk approval, store products, restore, refunds, cross-device access and end-to-end entitlement recovery remain **UNVERIFIED** in this research task.

## What is worth paying for?

Working thesis for approval: Ari helps a person understand what changed in their money, decide one useful next action, and see whether it worked. Tomo explains the user's own records in context. Pro should reduce repeated interpretation work through accurate reviews, upcoming-obligation context and editable scenarios, with every number traceable to records and assumptions.

A chat box, colorful charts, generic saving tips or a transaction quota are weak recurring value. Free spreadsheets and basic trackers already cover them. A premium claim becomes credible only when users return to an accurate weekly review, correct little, and act on it. A stale dashboard undermines willingness to pay more than a better paywall can recover. Do not imply automatic bank connectivity, guaranteed savings, investment advice or subscription cancellation services that Ari has not verified.

Evidence of willingness to pay is currently indirect. Competitors charging money shows a market, not Indian demand for Ari. No Ari retention, churn, conversion or user-interview data was supplied. Run 12–15 target-user interviews and a consented four-week pilot before fixing price. Ask users to describe their last money decision and their existing workaround before showing pricing; test real checkout intent only after payment gates pass.

## Official market anchors

| Product | Current official observation | Implication for Ari |
|---|---|---|
| YNAB | US$14.99 monthly or US$109 annually; 34-day direct trial without card; sharing up to six people. Direct bank import has regional limits. | A full financial cycle can justify a long evaluation; household value need not require a separate tier. Do not convert US prices to INR and call that regional research. |
| Monarch | Current page lists Core US$99.99/year and Plus US$199.99/year; seven-day trial requires payment method; advanced planning separates Plus. | Premium packaging can follow a different job, rather than arbitrary basic-feature restrictions. Seven-day card trials trade commitment for friction. |

Sources: [YNAB pricing](https://www.ynab.com/pricing), [Monarch pricing](https://www.monarch.com/pricing). Marketing savings claims are not independent efficacy evidence and are not adopted for Ari. These are international anchors, not proof of Indian affordability.

## Three alternative models

All proposed INR totals are intended as consumer-facing tax-inclusive prices, subject to tax review and store price availability. Outside India use localized storefront prices and currency formatting, not INR-only logic. Annual discount is measured against twelve monthly payments. Grandfather or explicitly migrate existing subscribers only through a separately approved transition plan.

| | A: Free utility + Pro intelligence (recommended experiment) | B: Paid complete planning workspace | C: Free individual utility + household subscription |
|---|---|---|---|
| Monthly / annual hypothesis | ₹149 / ₹1,499 | ₹99 / ₹999 | ₹249 / ₹2,499 per household |
| Annual saving | ₹289; 16.16% | ₹189; 15.91% | ₹489; 16.37% |
| Paid job | Understand changes and plan next steps repeatedly | Maintain a guided planning workflow across a full month | Coordinate shared commitments and goals while keeping personal money private |
| Free commitment | Unlimited manual records, core dashboard, basic budgets/bills, own history, export, privacy, correction and deletion | Same durable free utility; paid guided workspace adds reviews and scenarios | Same individual utility; no penalty for living alone |
| Evaluation | Optional 14-day Pro preview after first reliable review | Optional 30-day guided workspace preview to cover a pay cycle | Optional 30-day shared-workspace preview after second member joins |
| First paywall | User asks for a second/deeper review or scenario, after seeing one useful result | After first completed planning review, before starting extended guided workflow | When both members choose to create a shared plan; never at an unsolicited invite |
| Upgrade trigger | Verified variance explanation, recurring review or editable forecast | Repeated planning checklist completion and follow-through | Shared bill ownership, shared goal decisions and permissioned summary |
| Cancellation | Direct management action; paid access through paid-through date | Same; retain historical plans and ordinary records | Same; explain household impact to payer; let members retain/export their own records |
| Grace hypothesis | Seven days for web renewal failure if provider states permit; store-managed grace on native | Same | Same; no shared-data deletion on grace expiry |
| Win-back | At most one consented invitation after a materially improved review, around day 30 | Offer a fresh guided month after an identified planning need | Invite payer back only after requested shared-workspace value returns |
| Main risk | AI cost and untrusted explanations | Too little paid differentiation from generous free utility | Permission, relationship and household-support complexity |

Preview means no-card, non-renewing evaluation in this proposal, not an implemented store subscription trial. An auto-renewing trial would need a separate approved mechanism with explicit renewal amount/date, store eligibility, purchase confirmation and cancellation route. Start no timer merely because someone creates an account. Reminder hypotheses: three days and one day before preview expiry, only via permitted channels. No automatic discount spiral; test a single time-limited returning-user offer only after measuring full-price retention.

### Proposed Model A entitlement matrix — NOT IMPLEMENTED

| Capability | Free | Pro candidate |
|---|---|---|
| Manual ledger, correction, deletion, privacy masking | Full | Full |
| Own historical data and basic CSV export | Full | Full |
| Basic budgets, bills and user-set reminders | Full | Full |
| Basic monthly totals and category views | Full | Full |
| First explainable review / Tomo demonstration | Available without a purchase | Available |
| Recurring weekly review with changes and supporting entries | Basic summary remains available | Personalized interpretation and follow-up |
| Editable cash-flow / goal scenarios with assumptions | Basic calculation remains available | Saved scenario comparison and progress review |
| Advanced report composition and review history | Existing records remain readable | New composed reports and comparisons |
| AI capacity | Explicit small evaluation allowance; no charge for errors/retries | Published fair-use budget only after measured costs; avoid “unlimited” |
| Household collaboration | Existing capabilities preserved pending decision | Not bundled until permissions and repeated value are proven |

Do not use a payment tier string as the feature policy. Before approval, inventory actual enforcement and existing users; source currently distinguishes pilot/pro/family while mobile entitlement is a named Pro entitlement. No silent remapping is proposed.

### Decision criteria and economics

Test ₹99, ₹149 and ₹199 monthly concepts in research, then run one production price experiment only with adequate sample and approved billing. Segment by locale, platform and user job; never personalize prices from financial distress. Primary measure: retained paid users completing useful reviews after two renewals. Guardrails: free-user retention, refunds, complaints, review correction rate, inference cost and support time. Track `upgrade_viewed`, `preview_started`, `preview_completed`, `purchase_verified`, `renewal_verified`, `cancel_requested`, `entitlement_expired`, `refund_verified`, and `reactivated`; verified billing events originate on the server. A cancellation request and churn are different events.

Illustrative sensitivity only: at ₹149 gross and an assumed 18% output GST, ex-tax revenue is ₹126.27. A hypothetical 15% commission applied to that base leaves ₹107.33 before AI, support and other costs. At ₹1,499/year, the analogous monthly contribution is ₹89.98. Neither calculation is a settlement forecast: tax liability, commission base, input credits and provider agreements need accountant verification. Require positive contribution at observed heavy-user inference cost plus support, rather than hiding cost behind an arbitrary transaction limit.

## BillDesk, Razorpay and native store payments

| Requirement | BillDesk | Razorpay | Google Play Billing | Apple IAP |
|---|---|---|---|---|
| Best role for Ari | Potential web India gateway after approval | Existing web India rail; assess readiness before replacing | Default Play-distributed native digital subscription | Default iOS digital subscription, especially India |
| Recurring methods | Cards, UPI AutoPay, eNACH; enablement through relationship manager | Cards, UPI, eMandate advertised; merchant-specific activation matters | Store-supported methods and subscription mandates vary by region/account | Store-supported methods vary by storefront/account |
| Public fee evidence | No universal commercial quote verified | General gateway baseline 2% + GST; subscription surcharge requires quote | Automatically renewing subscriptions 15%; India enrolled alternative-billing transaction typically 11% store fee plus gateway cost | Standard first-year proceeds 70%, then 85%, minus applicable taxes; enrolled Small Business proceeds 85% |
| Settlement | Contract, reserve and reconciliation files UNVERIFIED | Exact merchant schedule UNVERIFIED; obtain current schedule, reserves and accelerated-settlement price | Orders/refunds/chargebacks net into monthly payout, generally around next month's 15th | Agreement describes payout no later than 45 days after monthly close, subject to its conditions |
| Refunds / disputes | Refund API exists; fees, deadlines and chargeback liability need quote | Refund and dispute operation evidence required; “no refund fee” is not proof original processing fees return | Store and developer refund controls; reconcile refunded/voided transactions and net payout | Apple refund decision and server refund notifications; reconcile revocations |
| Lifecycle / retries | Mandate modifications and pause/revoke webhooks; merchant orchestration required | Subscription webhooks and retries; distinguish pending/halted from paid-through entitlement | RTDN plus Developer API state; grace and account hold differ | Server Notifications V2 plus signed transaction/status verification; billing retry and grace differ |
| Invoices | Pre-debit invoice concept is not automatically Ari's tax invoice | Invoice tools exist; tax fields still require merchant correctness | Store receipts and financial reports; check merchant tax obligations separately | Store receipts and financial reports; check merchant tax obligations separately |
| Upgrade / downgrade | Mandate change may need customer authentication | Verify supported plan changes and proration for each payment method | Use supported replacement modes and current purchase state | Use subscription groups and store-defined upgrade/downgrade timing |
| Operating burden | Approval, encrypted/signed API integration, merchant recurring workflow and reconciliation | Existing source reduces migration effort; still needs secure event processing and customer support | Native catalogue, purchase acknowledgement, restore, RTDN and policy compliance | Native catalogue, subscription groups, restore, notifications and review compliance |

Official capability and fee references: [BillDesk recurring FAQ](https://docs.billdesk.io/docs/product-faqs), [BillDesk recurring setup](https://docs.billdesk.io/docs/get-started-recurring-payments), [BillDesk refunds API](https://docs.billdesk.io/reference/createrefund), [Razorpay Subscriptions](https://razorpay.com/subscriptions/), [Razorpay pricing](https://razorpay.com/pricing/), [Google service fees](https://support.google.com/googleplay/android-developer/answer/112622?hl=en), [Apple subscription proceeds](https://developer.apple.com/app-store/subscriptions/), [Play payouts](https://support.google.com/googleplay/android-developer/answer/137997?hl=en-EN), [Apple payment agreement](https://developer.apple.com/support/downloads/terms/schedules/Schedule-2-and-3-20240610-English.pdf).

Razorpay's public pages are insufficient for all-in subscription pricing: its [official pricing explanation](https://razorpay.com/blog/?p=26027) describes 2% gateway plus 0.99% subscription fee plus applicable GST, while the subscriptions product page shows a struck-through 0.9% offer. Obtain an account-specific written quote. Do not promise a blanket 2% all-in recurring fee, free UPI processing, returned processing fees on refunds, or a guaranteed T+2 settlement. BillDesk price, minimum commitment, onboarding ETA, settlement, reserves, refund/chargeback charges and operational SLA are **UNVERIFIED commercial terms**.

### Platform and region decision

On independent web checkout, either approved gateway can serve a subscription subject to its contract and local requirements. For Play India, financial-management software is explicitly within digital billing policy. India's alternative-billing programme requires offering the alternative alongside Play, enrollment, trust/safety requirements and transaction reporting; API-integrated transactions must be reported within 24 hours. A four-percentage-point store-fee reduction does not remove store fees. [Play Payments policy](https://support.google.com/googleplay/android-developer/answer/9858738?hl=en), [India programme](https://support.google.com/googleplay/android-developer/answer/13306652?hl=en).

For iOS India, plan on IAP for digital Pro; neither BillDesk nor Razorpay is a general replacement. Apple permits qualifying multiplatform access under 3.1.3(b), with the relevant purchases also offered in-app. The current guidelines allow external purchase links in the US storefront; that exception must not appear globally. EU and other eligible markets have their own entitlements/agreements. Do not identify storefront solely by device language, IP or chosen ledger currency. [Apple review rules](https://developer.apple.com/app-store/review/guidelines/), [external purchase documentation](https://developer.apple.com/documentation/storekit/external-purchase).

Apple has published EU changes with an October 1, 2026 effective date; those are future terms relative to this brief. Any EU launch needs a fresh assessment of the accepted agreement, fees and required payment-choice commitment. [Apple EU payment options](https://developer-rno.apple.com/support/payment-options-on-the-app-store-in-the-eu/). Google similarly permits alternatives only through applicable regional programmes. US/EEA Android alternatives require a separate current programme review before implementation; India's terms must not be generalized. This recommendation does not authorize any external checkout link in native clients.

### Recommended provider-independent architecture

`Provider adapter → verified subscription ledger → entitlement policy → application capabilities`

Keep provider account/customer/subscription/transaction identifiers in backend adapters. Normalize states such as pending, trialing, active, grace, canceled-at-period-end, paused, expired and revoked, retaining original provider payload metadata for diagnosis. A cancellation flag does not erase an already-paid period. Web checkout success is only a UI hint: bind subscription to authenticated owner, verify signature and retrieve provider state before granting access. Secrets stay server-side; client SDK public keys are not entitlement proof.

Persist provider event identity under a unique constraint and commit event receipt with state transition atomically. A subscription ID plus second timestamp cannot distinguish independent events. Out-of-order cancellation/renewal/refund events require current-state retrieval and effective-time handling. Verify raw-body HMAC/JWS or the provider's prescribed encrypted/signed format; reject wrong environment/app/merchant, unknown plan, ownership mismatch, replay and invalid signature. Never log card data, bank credentials, webhook secrets or financial narrative. Limit administrative overrides, record actor/reason/expiry, and audit them.

Razorpay documents at-least-once delivery, unique `x-razorpay-event-id`, non-guaranteed order and retries over 24 hours before disabling a failing webhook. A durable queue plus reconciliation job must cover outages beyond delivery retries. [Razorpay webhook practices](https://razorpay.com/docs/webhooks/best-practices/?preferred-country=IN). BillDesk's recurring onboarding describes encryption/signing keys and configured webhook URLs; confirm replay and retry contracts with its relationship manager. [BillDesk setup](https://docs.billdesk.io/docs/get-started-recurring-payments).

For Play, retain paid benefits in provider-confirmed grace, remove premium at account hold/expiry, and use current server API state rather than fixed duration assumptions. Google changed the default hold calculation to 60 days minus grace in December 2025. [Recovery policy](https://support.google.com/googleplay/android-developer/answer/16631229?hl=en), [subscription lifecycle](https://developer.android.google.cn/google/play/billing/lifecycle/subscriptions?hl=en). For Apple, configure and honor store grace and process refund notifications; a refund request alone is not a completed refund. [Apple grace](https://developer.apple.com/help/app-store-connect/manage-subscriptions/enable-billing-grace-period-for-auto-renewable-subscriptions), [refund notifications](https://developer.apple.com/documentation/storekit/handling-refund-notifications).

Cross-provider restore must avoid duplicate subscriptions: show current provider and manage-subscription route, attach only verified purchases to the correct Ari account, and require a defined account-transfer process. Store purchase cancellation and Ari account deletion are distinct operations; explain both and do not silently abandon an active charge. RevenueCat can remain a native adapter candidate; it is not a gateway or a substitute for backend entitlement policy, and its own fees/contract have not been assessed here.

### Operational evidence required before any approved launch

Obtain signed quotes from both gateways covering recurring method activation, mandate authentication limits, pre-debit notices, retry windows, settlement reports/UTR, GST fee invoices, export support, reserves, refund fee treatment, dispute deadlines, chargebacks, incident escalation and cancellation APIs. Demonstrate in isolated sandbox: create/authenticate/first charge/renew, failed charge/recovery, duplicate and reordered events, same-second independent events, callback ownership attack, refund/revoke, pause/resume, downgrade, restore after reinstall and missed-webhook reconciliation. Record exact app/backend/web commits and environment with evidence, without secrets.

Daily finance reconciliation should join provider charges/refunds/disputes to subscription periods and settlement reports; alert on money-without-entitlement and entitlement-without-payment outside approved trials/grace. Maintain a retry queue, dead-letter inspection and reversible support runbooks. Upgrade immediately only using approved proration; downgrade at period end by default and show exact effective date. Do not charge twice when changing rail. Treat chargeback investigation separately from ordinary cancellation and retain only required evidence.

## Decision requested from owner

Approve or revise Model A as a research/validation direction, including its candidate price and evaluation duration; the final entitlement matrix still needs explicit approval. Prefer retaining the existing web Razorpay architecture for validation while BillDesk approval/quote is compared, with native store billing as default. Do not migrate providers merely because another approval is pending. A BillDesk migration is justified only by measured method coverage, support, reliability or meaningful total-cost improvement after migration cost. **No provider or monetisation implementation is authorized by this brief.**
