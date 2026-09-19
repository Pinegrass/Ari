# Ordered post-observation funnel — 20 September 2026

Implemented locally with no new schema, provider request or production job.

The internal measurement report now contains `orderedPostObservationFunnel` alongside unchanged unordered `postConsentMilestones`. Its population is current v2 consented, nonexcluded episodes, not all signups. The observation start is the current episode's `started_at`; for migrated episodes this is a conservative migration watermark, not their original signup or consent date.

Two separate windows cover seven and thirty elapsed UTC days from observation start, with inclusive start and exclusive end. Accounts become eligible only when the whole window has elapsed. Observation starts at or before the current 90-day retention cutoff, missing starts and future starts are reported as unavailable rather than reconstructed. Immature accounts are separately counted and excluded from rates. Empty denominators produce null rates.

The ordered stages are server-confirmed transaction, report displayed, trial started, then verified charge. Each stage requires a strictly later server receipt timestamp than its predecessor and a receipt inside the same window/current epoch. Same-instant receipts do not establish order, regardless of identifier ordering. A later qualifying repeated event can advance a previously missing stage. Pre-observation receipts never backfill a migrated/reconsented episode.

Output reports cumulative account counts, fractions of eligible accounts and fractions of previous-stage accounts. These are descriptive observed sequences, not causal effects, population signup conversion or new-subscriber conversion. Verified charges can include initial charges or renewals. Provider delivery delays can move receipt timestamps outside a window. Withdrawal/exclusion changes the population. Existing local-calendar retention semantics are unchanged; these funnel windows deliberately use elapsed UTC time.

Implementation streams the same single core receipt query ordered by owner, receipt time and ID. It retains at most four stage positions per account per window plus aggregates. It does not load all accounts or receipt histories into memory.

Local fixtures exercise ordered/wrong-order paths, all 24 permutations of tied timestamps, precise window bounds, null denominators, immature/expired/missing starts, timezones, migration watermarks, epoch changes, exclusion and withdrawal. Focused validation: 78 funnel/streamed-report/v2/billing tests passed, including explicit empty-population/withdrawal assertions; root records final integrated totals.

Remaining measurement distinctions: preconsent/signup-wide tracking was deliberately not added; a complete population funnel would require a separately justified privacy/data contract. Actual mature seven/thirty-day cohorts and real verified payments require elapsed/provider evidence. Renewal opportunities, churn and recovery rates require lifecycle observation denominators; a count of webhook events or this four-stage sequence does not supply them. The separate paid-lifecycle lane must document its own supported semantics and cannot be replaced by this funnel.
