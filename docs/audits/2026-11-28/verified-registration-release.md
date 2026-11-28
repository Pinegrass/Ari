# Release checkpoint - 28 November 2026

## Repository manifest

- Mobile worldwide application:66de4ce272ce811ac5d2e170acd77caf0c3659ec, PR10.
- Public-v57 OTA application:58657425b14a2201f623e413cfc1bf6d94129ecc, PR11.
- Backend candidate:8bc977592412df0cae97648a54ad121075ca53e9, PR24; livefdd03c4.
- Web candidate:5611f643bc57ca739720b66f4a0a0c94f393b4a8, PR6; basef871456.

All new commits use dev@pinegrass.in for author and committer. gh is dev-pinegrass.
Canonical mobile/backend/web dirty changes remain intact in D:/Codex/Workex/Ari.

## Verification and release boundary

Worldwide:720 tests/74 suites, TypeScript, lint, zero dependency vulnerabilities.
Earlier native build541b5b79-fa8a-4dac-bdbc-5d808860b164 passed core/report/Arabic
flows44938263716/44940046041/44940729174. Those native flows predate this signup UI;
a new native signup acceptance remains required. Languages:EN,HI,ES,FR,PT-BR,AR.

OTA:517 tests/41 suites, TypeScript, lint, Android Hermes export pass. Exact runtime
84cc28590bb0a1fffcf4a346d97bd40e18faac45 reproduced after copying changed source
to physical D:/Codex/Artifacts/Ari/2026-11-22/ota-runtime. Source/native packages and
eas.json preserve the public runtime, without an override. New fingerprint/export:
D:/Codex/Artifacts/Ari/2026-11-28/ota-auth-fingerprint.json and ota-auth-export.
Retained XML native toolchain advisory remains a blocker, not waived. Old isolated
QA group2633d53d-8a59-4732-8e33-4ec8e8a5dec1 predates auth changes; it does not
accept this source. Public channel internal-release was not changed this session.

Web:137 tests/14files, TypeScript, lint,15route production build, four intercepted
Chromium signup/login checks pass. EN/HI pending pages visually inspected. Audit0.
Next16.4.6; ordinary npmci works. No hosted web deployment is claimed.

Backend:728 tests, blocking dependency audit, isolated PostgreSQL17.12 and real
GoTrue2.199.0/SMTPcapture confirmation, duplicate, replay, expiry proofs pass.
Latest CI46124695819 passes all three jobs. Staging country schema repair also
passes exact SQL reapplication and existing-US-profile preservation locally.

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

Detailed backend evidence: docs/email-registration-release-2026-11-28.md in
ari-backend PR24. Web evidence has the same path in aritomo-web PR6. Shared contract
SHA256901dfaab270eb5be7961ebb74b76d61996c8d04a7cb32f0b59e3786f6ffd9915.
Production migration and hosted SMTP delivery remain pending; captured local mail
is not evidence of actual sender delivery. No all-user sending jobs were rerun.


## Final hosted checkpoint

Staging deployment ec7b4a54-9f42-4be9-928c-c5cd7f6685ad succeeded, pinned8bc9775.
Fifteen hosted checks pass using an owned synthetic account: provider confirmation,
legacy426 and country400 guards, unconfirmed-login denial, token_hash confirmation,
confirmed API access, protected initial USD/free/user metadata, country-change409,
currency preservation, direct RLS privilege denial and confirmation replay denial.
Admin generate_link sent no mail. Fixture deletion verified auth.users=0/profiles=0.
Production remains unchanged. Actual SMTP delivery is awaiting owner authorization
for one test to dev@pinegrass.in; no mail is sent while permission is pending.

Worldwide CI46124985134 passes all four jobs (fd405d3). Web CI46124765506 passes
all checks and automatic preview5611f64 is READY at
https://aritomo-2zgt4inl4-pinegrass.vercel.app ; preview interactions remain unverified.
OTA CI46125037946 on434b1de passes tests/types/lint and fails retained XML audit.
This is an open release gate. No public channel mapping or Play build was changed.

Backend documentation head a2f8f341e85fc20af26a9a9b55ef0cd653a72bc7 records the
hosted proof. Staging remains pinned to application8bc9775; documentation changes
do not silently advance the deployed source. OTA audit reports eight advisories
for the retained xmldom package. New native dependency tree remains audit0.
