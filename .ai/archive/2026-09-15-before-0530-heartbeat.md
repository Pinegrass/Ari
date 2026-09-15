# Latest handoff — isolated S6 cohort reference

Heartbeat started14September23:11UTC (15September IST). Cold start matched mobile44d71f5/backendf79ec76/webdc4dcb8; no new source deltas. S1 actual delivery remains dependent on owner-held device testing; no repeated concurrency test or device access.

Backend e57ab26003ba9a4170b91ec78e552216ad2c318f adds measurement_cohorts.py and ten synthetic fixtures. Pure calculation only, not imported by production routes, jobs or analytics ingestion. No schema, migration, endpoint or live data change. Input is an already consent-scoped current v2 episode per user; legacy UTC counts cannot satisfy it.

Reference behavior: frozen episode timezone, server receipt dates, confirmed transaction activation, exact D1/D7/D30 activity after each entire target local date closes, nullable rates for no eligible cohort,7/30 completed-local-day distinct active counts. Nonmeaningful actions, future/current-day activity, pre-activation events, withdrawn/excluded episodes and expired activation provenance do not contaminate reporting. Duplicate current episodes and naive timestamps are rejected. Outputs contain aggregate counts and scope metadata, no user identities. Old activation is not replaced by earliest surviving activity.

Ten fixtures cover India local midnight; spring/fall New York DST; exact-day rather than ever-returned retention; empty eligibility; rolling windows and repeated actions; withdrawal/staff exclusion/expiry; current re-consent snapshot pre-activation filtering; just-inside90-day and future activation; duplicate snapshots and naive instants. The re-consent fixture tests only snapshot filtering, NOT consent epoch ingestion or concurrent withdrawal.

Independent bounded agent review found no blocking calculation bug and requested the last two boundary fixtures, which were added. Full backend336tests and scoped RuffF/E9 pass. Source committed locally; no push/deploy. Prior full334 run preceded the two added fixtures and is superseded.

Limitations: not a live cohort dashboard, not observed retention. Episode ingestion/idempotency/consent epoch/exclusion management/expiry/export, provenance-state lifecycle, client instrumentation and internal reporting still need implementation. No legacy counts relabeled. Next S6 milestone is additive versioned storage and coordinated consent/dedupe/retention design, including isolated PostgreSQL acceptance. Alert routing, security/backup gates, full Hindi/accessibility, commercial/provider and pilot outcomes remain open.

Live backend b855630, web7a1533f and Android internaldfdaec1 unchanged. Web localdc4dcb8 remains unpublished. Daily/outbox sends stay disabled; all device work pending by owner, iPhone separately deferred. No external calls, provider cost or production mutations this turn.
