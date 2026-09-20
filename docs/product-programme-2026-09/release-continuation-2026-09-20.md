# Authorized release continuation — 20 September 2026

Owner instructed “Go ahead, do the pending works” after the remaining-work report. This authorizes coordinated release and operational completion in the existing scope. Android physical testing and iPhone testing remain deferred; daily/outbox gates remain disabled. No store spending, outreach or real purchase is inferred.

## Initial release evidence

- Consistent private public/auth backup restored on isolated PostgreSQL17:26public tables/1,809rows match, no invalid indexes or unvalidated FK/check constraints. See backup-restore-acceptance-2026-09-20.md. Private dump retained outside Git; container removed.
- Six reviewed migrations applied to Ari Supabase cazigdaoqeoqnqwajibf and verified. Local→remote version mapping:
  - 20260919132311_measurement_v2 →20260920164507
  - 20260919134713_harden_internal_helpers →20260920164512
  - 20260919175629_billing_measurement_consent_start →20260920164523
  - 20260919175703_measurement_notification_attribution →20260920164530
  - 20260919183206_immutable_group_currency →20260920164541
  - 20260919184208_consented_billing_lifecycle →20260920164546
- All five new measurement tables have RLS enabled and no anon/authenticated CRUD privileges. Trigger helpers deny client execution; group helper denies anon and restricts authenticated lookup to the caller. Mutable-search-path and anonymous-definer advisor warnings cleared. Authenticated group helper warning remains intentional; leaked-password protection remains disabled and dashboard sign-in is needed.
- Pre-release API exact revision and actual receipt/maintenance freshness checks pass. Supabase reports seven completed physical backups; PITR disabled. This is availability evidence, not managed restoration acceptance.
- No paid-tier rows or linked Razorpay subscriptions found in the pre-release aggregate inventory. This does not prove provider inventory or real purchase lifecycle.
- Web candidate736b927 built READY as dpl_GtsgkRhNqHL3ojSrh1xreAG7BMim, https://aritomo-2kzqfhiso-pinegrass.vercel.app, using production configuration with --skip-domain. Custom-domain promotion pending legal business/contact details. Hindi landing/login browser checks pass without console errors; authenticated web acceptance still pending.
- Android native configuration unchanged. Found local speech package drift3.1.2 vs locked57.0.0; restored verified lockfile tarball and recomputed runtime. Exact match f82b9c561785202f8057920d7a8a052d15c1ed33; types and3speech tests pass. No OTA yet.
- Additional real-schema gap: used invite recipient FK blocks account deletion. Fix/model/regression and exact PostgreSQL proof prepared; full backend regression in progress. Do not deploy backend until reviewed and passing.

The chronological findings below culminate in the final deployment evidence. Required product acceptance gates remain open.

## First backend deployment and live finding

Backend6bcb948ad881e6febd29102a423c9ef6d491d4ba pushed with paginating runner. Railway deployment1c1f834f-8b33-4897-9a39-6bbbd5ec18d6 approved through existing authorized account after commit-author gate; SUCCESS and exact health verified. GitHub CI35524139498 passed pytest and pip-audit. Additional invite FK migration20260920164749 mapped to remote20260920165324 and verified SET NULL.

Read-only hourly readiness workflow published and expected revision configured. Manual inspection35524272033 passed exact revision, receipt freshness43.6min and maintenance541.8min; no sending job invoked. This establishes monitor operation, not external alert delivery.

First live smoke passed76checks but normal account deletion returned502. All fixture accounts/rows were cleaned and absence verified. Separate disposable probe established Supabase reauth200, matching string identity, logout204 and admin delete200. Backend compared provider string ID to PostgreSQL UUID without normalization; correction and UUID/string matching/mismatching regressions are in progress before client release. No existing account was used.

## Corrected backend acceptance

Final backend05a856ffa4d64a5f2523a596ff2a620149620133 normalizes the PostgreSQL UUID during password-confirmation identity checks. Full623tests and four UUID/string match/mismatch regressions pass. GitHub CI35524478249 passed. Railway9f4bb193-4abe-4e1b-a989-1b480b54a5be is SUCCESS; exact live revision verified.

Final private live smoke passed80checks, including consent/dedupe/withdrawal/export, no implicit consent, daily disabled capability, decimal transaction persistence and ownership, planning retry/conflict/delete, immutable group currency, group expense retries and exact cash settlements, normal deletion of joined user then creator, rejected deleted-user access and complete fixture cleanup. No real payment, AI generation, notification send or device use. First failing run/probe remain preserved separately.

Hourly read-only readiness workflow configured for the final SHA. Run35524566660 passed health/revision and actual step freshness (maintenance547.5minutes, receipts49.2minutes). Final deployment-scoped HTTP500–599 log query returned no entries at inspection time. External alert delivery/recovery remains unverified.

The unpromoted web candidate does not receive CORS permission for authenticated production API calls; no origin permissions were widened. Public Hindi landing/login rendered correctly, with no browser console errors. Authenticated candidate web flows await public promotion after legal details, not inferred from API checks.


## Android publication and final remaining gates

Android update01a0bfc7-b47d-75e9-aefa-494c1c8207b9, groupb0b1612f-9344-4af6-8559-0d6de6a3a6b4 published20September17:05UTC to internal-release using production environment. Runtimef82b9c561785202f8057920d7a8a052d15c1ed33 exactly matches the installed native build. App source9ed8a704e3904c71b4ce1cbcb8604a7a4c634985, publicationHEADbbf82c4e8213d8671b905a1041393c9865b45709. No physical device accessed or installation claimed. No new native/store/iOS build. Rootmaster push omitted because its workflow would request a native preview build.

Web candidate is ready, but public promotion waits on the already-requested registered business address and contact confirmation. Supabase leaked-password protection waits on the already-requested dashboard sign-in; existing database connector access lacks this configuration operation. Neither input is invented or repeatedly requested.

Daily remainsfalse on Railway; GitHub daily/outbox enable variables remain absent. Never invoke manual all/outbox as a diagnostic. Physical Android/iPhone acceptance, real notification/payment/provider/store setup, human Hindi/accessibility/legal review, representative load, actual external alert delivery/recovery and elapsed pilot outcomes remain required. No sprint newly accepted and no complete-programme claim.

Prepared browser fixture helper was not executed because authenticated candidate preview has no production CORS permission. Private API test accounts were all removed. Existing user records preserved. Completed work and partial publication status are recorded in the compact continuity pack and sprint ledger.
