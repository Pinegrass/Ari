# Measurement v2 — engineering contract for S6

14 September 2026. Source-grounded design proposal, not an implemented API, deployed schema, approved commercial policy or measured retention result. Review implementation against this contract before creating a migration. No live reads or mutations were used in this audit.

## Existing evidence and gaps

routes/product.py accepts only an allowlisted event and counts receipt-day UTC, capped at1000/user/event/day. models.py MeasurementConsent has enabled only; MeasurementCount has user/day/event/count. There is no event identity, consent epoch, occurrence instant or measurement timezone. Identical posts count twice in test_product_completion.py. Withdrawal uses the user lock and purges counts, but re-consent cannot distinguish delayed old requests.

Mobile analytics maps eight events. Transaction measurement occurs after local save before server acceptance; push_opened is not mapped to first-party ingestion. Web measurement lacks transaction instrumentation; report effects can count refetches. Existing records therefore cannot establish reliable cross-platform activation, local-day cohorts or attributed notification-open rates. last_active_at is auth activity, not consented meaningful engagement.

Maintenance uses a UTC date cutoff that can retain almost91days despite up-to90-day copy. No explicit measurement staff/test exclusion exists. Legal route84 still mentions PostHog cohorts while current mobile counts use first-party storage; audit privacy copy separately. No D1/D7/D30 or WAU/MAU report exists.

## Proposed v2 semantics

- Population: currently consented, explicitly non-excluded accounts with a v2 measurement episode. Label as measured activation cohorts, not all signups. Existing users enter on their next qualifying action; do not label them new users. Never backfill from financial records or reinterpret legacy UTC counts.
- Freeze a validated IANA timezone per episode (saved notification timezone, otherwise account locale default). Backend computes receipt instant to local date. Initially no client-provided dates; offline arrivals count on receipt day, with this limitation visible in report metadata.
- Activation: first server-confirmed transaction creation in the episode, shared across clients. Edits/idempotent transaction replays do not reactivate. Ingestion occurs only with consent.
- Meaningful active day: confirmed transaction creation, successful planning save, report display or intentional report action. Preference changes, sends, foreground events and trial starts alone are not retention. Deduplicate report refetches from intentional displays.
- Dk: use only episodes whose entire activation+k local day has closed. Numerator is meaningful activity on that exact date. Always return eligible denominator, numerator, immature count and nullable rate. No eligible users means unavailable.
- WAU/MAU: distinct eligible users over their last7/30 completed local dates. Label rolling windows explicitly; any percentage needs a named population denominator.
- Withdrawal: atomically disable and purge analytics/receipts/episode counts. Re-consent creates a random new epoch. Old-epoch requests remain rejected after re-consent. Historical aggregates can change after withdrawal; disclose population scope.
- V2 event request: event, opaque UUID eventId, consentEpoch only. Preserve ID on transport retries. User-lock plus unique(user,epoch,eventId) makes count update atomic. Same ID/event is a duplicate success; changed event is conflict. No financial IDs, amounts, merchants or arbitrary properties.
- Exclusion: server-managed staff/test flag or table, distinct from authorization role; apply at ingestion/report and purge on exclusion. No email-substring inference or client-controlled exclusion.
- Exact timestamp-based90-day expiry, with separate definition for aggregate/cohort provenance. Never reinterpret the earliest surviving action as first activation or silently reactivate an episode after provenance expires. Export all retained measurement metadata. Resolve episode-state retention carefully before schema implementation; do not erase stale-epoch protections just to meet a count cutoff.
- Notification attribution requires a separately validated opaque delivery reference and ownership check. Aggregate opens are not a delivery/open conversion rate. Keep unavailable pending S1 evidence.
- Commercial metrics must originate in verified server billing lifecycle. Separate cancellation, grace/failure, expiry, renewal opportunity and trial conversion; paid outcomes unavailable until S5.

## Implementation sequence and acceptance

1. Define fixtures for UTC/local midnight, DST, completed-day maturity, zero eligible denominator, withdrawal/re-consent and staff/test exclusion.
2. Add versioned v2 episode/receipt/aggregate storage and server-only permissions; preserve old-client endpoint compatibility. Legacy records remain explicitly UTC/version1, excluded from v2 cohorts.
3. Deliver epoch validation, idempotent ingestion, exclusion, withdrawal/export and expiry together. Prove concurrent retry/withdrawal on isolated PostgreSQL before release.
4. Instrument confirmed server actions and both clients; remove redundant transaction counts. Verify report intent/refetch semantics and acknowledged retries.
5. Add internal aggregate-only read reporting with as-of, schema version, timezone policy, population/maturity and unavailable-data metadata. No public per-user analytics dashboard.
6. Synthetic end-to-end acceptance and cleanup, then reviewed additive migrations and coordinated release. None is authorized merely by this design document.
7. Observe actual elapsed cohorts. Fixtures and code cannot establish real D30 retention, renewal or willingness to pay.

S6 definitions audited and proposed; implementation and reporting remain pending. This contract is independent of device/payment blockers, except actual notification and paid attribution.
