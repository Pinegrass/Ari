# Latest handoff — web/auth fixes released

Owner supplied the registered Imphal address/+91 7629001131 and authorized Supabase sign-in/completion. Contact details are live in English/Hindi terms, privacy and support. Supabase existing GitHub sign-in succeeded; leaked-password protection enabled, persisted dashboard state and security advisor verified. Existing membership helper warning is intentional/caller-restricted.

Backend 1673c1479a1dc9c579a94af5b2cd6cdfb61154aa is pushed/live on Railway099478be-67d6-4e15-9992-8a0481aebe79.642tests, CI35909696539, exact health and read-only readiness35909949244 pass; populated EN/HI Reports GETs passed on predecessor b322ac6. PostgreSQL UUID report/recurrence provenance fixed. Outbox API has independent default-off server guard; DAILY_NUDGES_ENABLED and NUDGE_OUTBOX_ENABLED bothfalse, schedules off. No additional migrations. Prior seven migrations/backup/80APIchecks remain historical evidence, not rerun.

Web d39ad2c5607357c87432ada9ed327c58f3fdfc0a promoted to aritomo.in as dpl_5QkwZBza1UPEVEtoXdXJqoncNp6J.132tests, lint, TypeScript and15pagebuild pass. Fixed native decimal validation, Hindi settings/Inbox/category copy, unavailable-checkout claims, repeated Supabase Auth clients and unbounded dashboard loading. Browser regression and fixture cleanup are in web-auth-acceptance-2026-09-20.md. No physical device tests.

Android internal OTA remains01a0bfc7-b47d-75e9-aefa-494c1c8207b9, source9ed8a704e3904c71b4ce1cbcb8604a7a4c634985/runtimef82b9c561785202f8057920d7a8a052d15c1ed33. Device-unverified; hold since14September persists; iPhone separately deferred. Rootmaster not pushed because it requests native builds. Web commits are locally retained and CLI deployed; do not push merely to archive if it causes a duplicate release.

Weekly scheduled run35526286124 on05a856f processed79/failed1. Old logs did not retain the exception. Concurrent missing DeepSeek/malformed Gemini responses do not establish cause. Future weekly exceptions have safe allowlisted classification. Do not rerun sending jobs to reproduce.

Remaining: actual device/push/tap and combined-channel acceptance; BillDesk/Play/catalogue/real purchase lifecycle; human Hindi/native accessibility/legal review; representative query-plan/load, real external alert receipt/recovery and full infrastructure recovery; consented elapsed pilot. Deterministic nudge fallback now honors Hindi; arbitrary generated content still needs separate review. No all-sprints completion claim. Follow-up ACTIVE. Preserve data and unrelated untracked historical files.

Latest evidence: docs/product-programme-2026-09/web-auth-acceptance-2026-09-20.md. Prior release-continuation and backup-restore reports retain exact migration and older artifact evidence.

24 September acceptance: fresh sign-in and full Hindi/English cold reloads passed on live web d39ad2c; empty-account Hindi fallback passed on backend1673c14. Disposable fixture cleanup verified. Local web candidate a060351 corrects mixed Inbox cards being labelled as transaction entries; scoped ESLint and diff check pass, not deployed. Receipt freshness failed again on35914460602 (135.4min); observed receipt gaps257.15/215.25min precede execution. Threshold unchanged; no jobs or releases triggered. See docs/product-programme-2026-09/browser-scheduler-acceptance-2026-09-24.md.
