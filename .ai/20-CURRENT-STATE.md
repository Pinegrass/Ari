# Current state - 28 November 2026

Worldwide source66de4ce passes720tests/74suites, TypeScript, lint and audit0.
New signup UI still needs native acceptance; earlier native flows remain historical.

Ari remains free. New commits and GitHub operations use dev@pinegrass.in;
active gh identity is dev-pinegrass. Expo and GitHub billing are resolved.
Backend CI46124695819 on8bc9775 passes pytest(728), blocking pip-audit and real
GoTrue/PostgreSQL fixture proofs. Production remains fdd03c4; candidate PR24
includes PR23 account-currency protection. Existing canonical dirty work is preserved.

Email registration now supports202 pending verification without adopting a session;
mobile/web send email-verification-v1. Explicit IN/US/GB/AU country remains the
supported financial contract. Backend trigger protects roles and existing profiles;
clients must ship first before old registration receives426. Sign-in stays compatible.

Supabase schema-only staging fzrlbodokgisxcyblmhm has no copied production rows.
Initial replay failed because the manually added country column was missing from
history. Applied an idempotent country repair, exact entitlement protection and
signup trigger only to staging. Initial branch status remains MIGRATIONS_FAILED;
no status override or production history mutation. Hosted API acceptance is underway
in isolated Railway environment491faae0-506a-45e1-bf29-84e3652c2634, service
f009c736-594f-4f6a-8a6e-4cbe07ba9f8e, pinned8bc9775. AI/sending/cron stay off.

Production receipts show48 successful completions in24hours. Maintenance readiness
still lacks actual execution evidence; green no-op workflows do not count. Daily/
outbox remains off. Monthly acceptance is1December09IST and is not accepted early.

World release gates: hosted SMTP/confirmation and client-first rollout; new-market
currency/country contracts; prior sync/data-safety integration; fluent translations,
legal and Play listing acceptance. Personal-device/iOS testing remains paused.
No public OTA/native store release is claimed. Never force an OTA runtime.
