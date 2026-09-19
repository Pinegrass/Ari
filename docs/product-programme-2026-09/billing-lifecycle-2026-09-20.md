# Consented billing lifecycle implementation — 20 September 2026

Status: implemented locally; synthetic verification only. No payment, provider request, migration deployment or store release occurred.

The original four verified webhook counters remain. A separate optional observation table now records initial charge, renewal charge, charge of unknown sequence, billing issue, cancellation and explicit expiration. RevenueCat provides the event classification; Razorpay paid_count distinguishes first/subsequent charges only when it is a positive integer. Unsupported payloads remain excluded.

Exact optional storage: account user_id, current consent epoch, deterministic event UUID, nullable subscription pseudonym scoped to epoch and provider, event kind, provider-generated occurred_at, server received_at, and nullable verified cycle_start/cycle_end. No amounts, currencies, products, payment methods or raw provider/customer/subscription IDs are copied. This is account-consented server webhook evidence, not private-device collection. Withdrawal, exclusion and deletion purge it; export includes billingObservations. Observations and old cycle timestamps expire within 90 days. Future annual period ends never extend observation retention.

The aggregate is a separate current-consent SQL snapshot, streaming one account at a time. It excludes withdrawn, excluded, previous-epoch, pre-consent, future and expired evidence even before maintenance runs. It reports cases rather than subscriber totals:

- Trial receipt cohorts close after 14 days; only a retained verified charge during that window is an observed conversion. Prior charges do not qualify. Missing charge evidence is unknown.
- Known paid cycles close after a 7-day observation follow-up after their verified end. This is not provider grace. Duplicate cycle terms are one opportunity; only a verified renewal with matching next-cycle timing is observed.
- Billing issues following known paid evidence have a 7-day recovery window. Explicit expiration following paid evidence has a 30-day reactivation window. Both require the same consent-scoped subscription.
- Explicit expiration among known paid cycle opportunities has its own count/fraction. Cancellation is not expiry or refund; overlapping provider entitlements prevent interpreting this as net account churn. churnRate remains null.

Only mature windows enter denominators. Unsupported or expired baseline/cycle evidence is historyUnavailable. Annual baselines can expire before renewal and are not reconstructed. Late verified webhooks may revise observed outcomes within fixed windows; withdrawals and retention can change historical counts. No historical provider backfill was performed.

Validation: tests/test_billing_lifecycle.py covers fixed windows, pre-trial charge exclusion, unknown baselines, same-subscription isolation, cancellation, expiration/renewal coexistence, duplicate cycles, annual retention, current epoch, exclusions, withdrawal, deterministic duplicate handling, pseudonym rotation, Razorpay unknown sequence and transaction rollback. Existing measurement/billing suites also run. Isolated PostgreSQL verifier applies exact 20260919184208 migration and checks fifth-table RLS and client privilege denial; execution results are recorded by root orchestration.
