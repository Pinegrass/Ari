# Verified billing events and entitlement contracts — 19 September 2026

Local implementation only. No provider requests, charges, store action, production migration or release was performed. Synthetic fixtures do not establish real purchase/restore/refund acceptance.

## Measurement contract

Authenticated RevenueCat and HMAC-verified Razorpay webhook processing can record four server-only receipt names: `billing_charge_verified`, `billing_cancellation_verified`, `billing_expiration_verified`, `billing_issue_verified`. The billing audit, entitlement mutation and measurement receipt commit together under the same account lock used by consent withdrawal. Provider/event UUID5 identity deduplicates receipts; the existing billing audit also rejects webhook retries.

Collection requires current explicit v2 consent and an event generated at or after that consent's `started_at`, and no later than receipt time. Legacy consent rows receive migration-time start values; historical consent dates are not invented. Withdrawal/exclusion removes receipts and consent start. Re-consent does not import delayed old events. Receipt storage contains no amount, product, provider identity, payload or currency.

RevenueCat measurement requires the configured entitlement, a production store, and a recognized lifecycle event. A charge additionally requires a positive price, a nontrial period and no family-sharing grant. Razorpay requires the configured live key, current owned subscription, configured plan and, for a charge, a captured positive payment. Missing/unsupported evidence fails closed. These conservative predicates may exclude legitimate events with incomplete provider fields.

Aggregate outcomes report counts of observed provider events in the retained receipt window for current consenting, nonexcluded accounts. They do not claim subscriber totals, conversion rates, revenue, separate refund counts, or a unique-trial denominator. Initial charges and renewals share the charge count. Cancellation is distinct from expiration but can include provider refund notifications. Out-of-order valid events are counted as events, never treated as current entitlement state. Device-local private mode alone cannot stop a server webhook; account measurement consent must be disabled to stop these server receipts.

## Entitlement safeguards

RevenueCat events now require the configured entitlement, production environment/store, supported type and valid generated timestamp before changing access. Ordinary cancellation keeps the paid period; expiration removes that provider's grant. Razorpay requires current subscription ownership and configured plan. Invalid expiry does not invent a new paid period.

Separate provider watermarks reject stale grants; expiration/revocation wins equal-timestamp collisions. Provider-specific active/expiry state is combined, so one known provider's expiration cannot erase the other provider's valid grant. Razorpay family tier is retained. Verified reconciliation also saves provider-specific state under the account lock and refuses an in-flight response overtaken by a newer webhook. Unknown/malformed provider identities are handled without issuing invalid UUID database queries.

Existing accounts have only the old combined entitlement state. The migration preserves it and marks provider truth NULL (unknown); newly created accounts default to false. A verified inactive snapshot clears that provider, but old combined access is preserved while the other provider remains unknown. Once both are known, only their actual active windows determine access. **Coordinated release acceptance must reconcile existing paid accounts against both providers before relying on the new provider projection.** POST `/api/billing/reconcile` accepts optional `{"provider":"revenuecat"}` or `{"provider":"razorpay"}` to make both paths reachable; omitted provider preserves existing routing. An explicit Razorpay reconciliation with no owned subscription resolves that source as absent without a network request. Malformed provider results never clear state; verified absent/expired results do. HTTP failures/404 retain prior state. No migration can safely infer those facts from the old unchecked audit payloads. Live store cancellation/refund behavior, aliases/transfers, overlapping provider subscriptions and purchase/restore remain required external acceptance.

## Release order and verification

Apply `20260919132311_measurement_v2.sql`, then `20260919175629_billing_measurement_consent_start.sql` and the notification attribution migration before publishing this backend. The additive billing migration adds consent start plus per-provider state/watermarks; it preserves existing user rows and enables no sends. Older code ignores the additional fields, but rolling back would restore the old billing safety defects.

Targeted suites cover authorization, HMAC, ownership, unsupported/test/trial/zero-price events, retries, withdrawal/re-consent, stale/future timestamps, rollback, provider overlap, cancellation, and equal-timestamp revocation. Root integration records final suite totals and isolated PostgreSQL migration/concurrency proof. Final targeted verification is recorded below after reconciliation regression tests.

Provider semantics were checked against the official [RevenueCat webhook fields](https://www.revenuecat.com/docs/integrations/webhooks/event-types-and-fields) and [Razorpay subscription webhook documentation](https://razorpay.com/docs/payments/subscriptions/subscribe-to-webhooks/). Supabase's current [migration guide](https://supabase.com/docs/guides/deployment/database-migrations) was used; the migration filename was generated by the installed CLI.

Targeted verification: 65 tests passed across billing measurement, webhook entitlement, release regressions and reconciliation. Scoped Ruff F/E9 passes. This includes known-provider expiry, old unknown-provider preservation, explicit provider selection, malformed expiry, and same-timestamp expiration priority.
