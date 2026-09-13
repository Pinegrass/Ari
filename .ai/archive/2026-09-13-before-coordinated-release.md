# Latest handoff — prioritized nudges and three daily opportunities

Owner requested shared priority engine and daily nudges3times/day. No optional timing reply arrived; used stated9AM/2PM/7PM user-timezone opportunities, skipping ineligible/duplicate actions. Implementation complete locally: mobile d0093c5, backend b855630, web7a1533f.

Shared selector: ready confirmed obligations due within2days, stale/incomplete plan, unread weekly/monthly review, legacy spending/activation guidance. Home direct routes; report push preserves period/date. Dismissal requires server acknowledgement and suppresses24hours, with failure/retry UI. New worker rechecks under user lock, tracks one attempt per window, caps3/localcalendar-day and default21/rollingweek, respects saved lower limits/quiet/opt-outs. Duplicate/unknown sends protected. Pages50users with8second start-work budget and cursor runner. No migration.

Daily endpoint and workflow gates remain OFF in live configuration. No deploy, push, OTA, real notification or device test. Need coordinated backend/client rollout, real push/receipt and PostgreSQL concurrent daily-worker acceptance before enablement. Existing isolated outbox concurrency fixture now explicitly sets weekly cap1 to preserve its quota test.

Verification: mobile52suites/556tests, backend309tests/Ruff, web12tests/types/lint/build pass. Mobile types/lint0errors; two pre-existing App.tsx duplicate import warnings. Report `docs/product-programme-2026-09/daily-nudges-2026-09-13.md` records limits. Source-only implementation; prior live releases unchanged. Previous calm Home is also unpublished. Unrelated untracked files preserved.
