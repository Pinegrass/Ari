# Consent-scoped notification attribution and receipt locking

Local candidate only. No provider requests, device access, rollout or scheduler activation.

## Implemented contract

- A dispatch reservation creates an optional measurement marker only for the current explicitly consented, nonexcluded account. Its random delivery identity accompanies the existing safe routing payload; no financial values or consent identity go to Expo.
- Provider acceptance is stored separately from mutable operational receipt status. A later receipt timeout cannot erase the known acceptance denominator. Provider handoff remains distinct from device display.
- Authenticated `/api/measurement/v2/notification-open` accepts exactly `deliveryId` and `consentEpoch`. Account ownership, matching current epoch, dispatch age and first-open deduplication apply. Local reminders and generic inbox interactions do not populate this denominator.
- Withdrawal/exclusion erase markers, account deletion cascades, and expiry removes markers at exactly 90 days from dispatch. Export includes dispatch/acceptance/first-open times and identifiers. A late provider response only updates an existing marker and cannot recreate withdrawn data.
- Rates describe observed taps among known provider-accepted dispatches in the retained window. Recent dispatches are not mature conversions; authenticated tap reporting is not proof of reading. Private mode, missing client transport and unavailable consent prevent some observations. This is not a population-wide engagement rate.
- Receipt reconciliation releases delivery locks before clearing a matching dead device token under the user lock. This avoids a user→delivery versus delivery→user deadlock. A crash between the commits can leave a dead token until a future send rejects it; it cannot resend the completed event or erase a replacement token.

## Verification

- Synthetic API/push fixtures cover malformed/foreign/expired/future identities, opt-out, re-consent, duplicate taps, unknown outcomes, immutable acceptance, late acceptance after withdrawal and marker-free unconsented sends. All HTTP provider calls are mocked.
- Exact additive SQL migrations were applied to an empty loopback PostgreSQL16 fixture. Four measurement tables have RLS and no PUBLIC/anon/authenticated data access. Concurrent duplicate taps keep one first-open; withdrawal races erase markers and receipts.
- Existing daily reservation/concurrency proof was updated for the new dependency and passed again. An added real PostgreSQL lock-order race proves receipt processing and a concurrent user-first token replacement complete without deadlock and preserve the new token.
- Root's consolidated report records final complete suite totals and source commits.

## Release ordering and remaining acceptance

Apply the measurement-v2, billing consent/provider-state and notification attribution migrations before the new backend; publish the compatible maintenance runner before/with that backend; clients follow. Old clients omit the marker and continue routing; historical dispatches are not backfilled. Keep daily/outbox disabled until explicit acceptance. Real Expo/device receipt and cold/warm routing acceptance remain pending under the owner's device hold.

## Mature action follow-up (20 September)

The internal report includes `actionAfterOpen24Hours`: provider-accepted, authenticated opens with a complete 24-hour follow-up window form the denominator; a strictly later meaningful receipt within 24 hours forms the numerator. Only retained dispatches/current consent/nonexcluded accounts count. One action can follow multiple opens. This is temporal association, not causation, unique users or proof that missing events mean inactivity. Seven window/ordering/event/epoch fixtures and the actual PostgreSQL aggregate passed. No extra events or client storage are introduced.
