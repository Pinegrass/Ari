# External release verification — 2026-09-06

Overall: **BLOCKED / FAILED acceptance gates. Not release-ready.** No public rollout, store submission, paid build, OTA, deployment approval, push, credential rotation or payment was performed. Only parent documentation changed; nested repositories remain unchanged.

## Repository reconciliation — VERIFIED

| Repository | Exact HEAD | Branch | Initial state | HEAD vs fetched origin/master |
|---|---|---|---|---|
| Mobile | 3e00ee520af3801c3b537d85b2ca89cb5fcbee0a | master | clean | 2 ahead / 0 behind |
| Backend | b3dc6589e7c08c424d005d1ac17ff5f4c96de753 | master | clean | 0 / 0 |
| Canonical nested web | be5f32a2deeb8f2cfa1b2a1b9913bb9340b5ef87 | master | clean | 0 / 0 |

Commands in each repository: git status --short; git branch --show-current; git log -5 --oneline; git fetch origin; git rev-list --left-right --count HEAD...origin/master; git rev-parse HEAD. The older standalone web checkout was not used.

Mobile diff ac641b6..HEAD contains four continuity files only. Backend/web match prior verified commits. Prior gates were retained, not rerun: mobile lint/typecheck and 35 suites/485 tests; web lint/typecheck, five tests/build; backend 225 tests. These are historical local evidence, not proof of external readiness.

## Android — VERIFIED artifact / BLOCKED Play

- EAS user pinegrass, owner of pinegrass-tech; project @pinegrass-tech/ari, ID ae18eabf-124f-4b0a-a09e-a2a40dfb473b.
- Build edc6a6ad-8c5e-4bc6-ac5e-a3d29d5dc142: FINISHED, ANDROID, STORE, production, app 1.3.0/code55; completed 2026-09-01T15:21:59Z.
- Build Git commit 7aeb65c797695ac97edb47a5cfcc7246bcb9b736. Delta to current mobile HEAD consists of documentation/continuity and internal submission profile, not application source.
- AAB download returned HTTP 200, application/octet-stream, 89,275,966 bytes. Local artifact: D:/Codex/Artifacts/Ari/2026-09-06/ari-1.3.0-v55.aab.
- Artifact SHA-256: 4530F53A81532E1B035A494D6C71E7C5C6552140788ACB101A50245688986850.
- ZIP CRC passed; BundleConfig.pb, base manifest and signature entries exist. jarsigner reports “jar verified”, with self-signed chain/no-timestamp and JarFile-versus-JarInputStream manifest-order warnings. This is not proof of Play acceptance; preserve artifact and resolve any store validation failure before upload replacement.
- Recent Android production builds: code55 FINISHED; code50 CANCELED (6648ef69-9a35-421f-a2a0-bbe2ba752d21); code51 FINISHED (16ccdf45-a02d-4564-85e6-6f955c5149dc); older code14/code13 FINISHED. Remote Android versionCode is now **56**; do not increment simply to submit 55.
- EAS submit history returns one ERRORED production submission d9998b9b-6331-4cba-b138-90040666bb0b (2026-08-21). Historical prompt omitted its final b. No internal submission was found.
- Service account: revenuecat-play@revenue-play.iam.gserviceaccount.com. Google generatedApks.list for code55 returned 403 “The caller does not have permission”. Separate uncommitted edits.insert permission probe returned the same 403; no edit was created. No upload/submission was attempted with denied access.
- Owner action: Play Console → Users and permissions → give this account access to com.pinegrass.ari with **View app information** and **Release apps to testing tracks** (CAN_VIEW_NON_FINANCIAL_DATA, CAN_MANAGE_TRACK_APKS). Manage testing tracks/tester lists is needed only for tester management. [Google permission definitions](https://developers.google.com/android-publisher/api-ref/rest/v3/grants).
- After access works, inspect the internal track to avoid duplicate upload, then submit with: eas submit --platform android --profile internal --id edc6a6ad-8c5e-4bc6-ac5e-a3d29d5dc142 --non-interactive. Never use the production submission profile for this task.

### Signing and installed device

EAS upload certificate and certificate embedded in the AAB both have SHA-256:
BB:96:A3:A1:AB:99:AE:98:57:BE:3E:E0:87:D2:34:C1:9A:47:06:52:D4:26:DE:4B:94:FA:C9:5A:86:D9:27:F0

This is the sole live assetlinks fingerprint. **UNVERIFIED:** whether it matches Google Play App Signing. Obtain the Play signing certificate from the owner's Play Console and compare; do not assume upload and Play certificates match or differ.

EAS reports no FCM V1 service account assigned and no remote Play submission key (local eas.json supplies the latter). Notifications remain UNVERIFIED.

ADB found com.pinegrass.ari 1.2.0/code47, installerPackageName null, last updated 2026-08-03. This is not a Play-installed code55. Launch, authentication, Google sign-in, transactions, reports, notifications, invites, RevenueCat reconciliation and crash reporting on the candidate remain BLOCKED/UNVERIFIED. No sideload was substituted.

## iOS / TestFlight — BLOCKED

EAS iOS production list returned no builds, submission list no iOS submissions, version:get no remote iOS version.

Production credentials inspection without Apple login shows **No credentials set up yet** for both Ari/com.pinegrass.ari and ShareExtension/com.pinegrass.ari.share-extension. Local credentials.json has Android only. No App Store Connect API-key assignment was established; an unattached account-wide key remains UNVERIFIED. No Team ID was obtained.

App Store Connect redirects to sign-in. Configured ascAppId is 6789322260; actual Apple-side ownership/manual TestFlight builds remain UNVERIFIED. Absence from EAS does not prove absence of manual uploads.

Owner action: sign in to App Store Connect/Apple Developer with access to this app/team, and make existing signing assets/API-key access available in EAS for both targets. Inspect TestFlight before any paid build. Do not rotate credentials or invent Team ID. Submit only to TestFlight, not public review. Installation remains BLOCKED.

Apple association publication is BLOCKED on verified TEAM_ID.com.pinegrass.ari and invite paths. No placeholder AASA was published. Publish through canonical web release workflow once the real identity is available, then test on TestFlight.

## Railway / database / jobs — partial VERIFIED

Project Ari_Backend (6a6336f9-3dbd-42ca-8aea-9da3747731af), production service web, source Pinegrass/ari-backend.

Running deployment d6987c4e-dc9d-4f24-bafd-0c490ac35c6a is SUCCESS, created 2026-09-02T10:15:50.738Z, with no Git hash in metadata. **Running revision UNVERIFIED.** Separate current-HEAD deployment 002cc562-2835-4d48-92d5-b2fe3e2ae3ab identifies b3dc6589e7c08c424d005d1ac17ff5f4c96de753 but is stopped/NEEDS_APPROVAL. It is not the running revision. No approval was performed.

Health returns 200 application/json {"status":"healthy"}, no redirect. Source health is shallow; it proves neither provider readiness nor deployed commit.

Railway variable presence checked without printing values: database/Supabase URL/anon/service-role settings, SECRET_KEY, GEMINI_API_KEY, CORS_ORIGIN, SCHEDULER_TOKEN are present. All six required RAZORPAY settings are absent. REVENUECAT_SECRET_API_KEY, REVENUECAT_WEBHOOK_SECRET and backend SENTRY_DSN are absent.

Read-only transaction using configured database: all **12 local migration versions** recorded; expected physical columns present for all **18 backend model tables**; unique subscription_events.razorpay_event_id index exists. This verifies migration records/column coverage, not every policy/constraint/migration effect. No customer rows retrieved.

GitHub scheduled-jobs workflow is active and SCHEDULER_TOKEN repo secret exists. Source defines weekly, monthly, subscription-leak and reactivation schedules. Latest five scheduled runs succeeded at backend HEAD. Run 33976990971 confirms Reactivation step success; 33955302653 confirms Subscription leaks success. No manual job trigger (jobs can send notifications/call providers).

Exact-match scan of current Railway server secret values against 245 tracked mobile/web client/config files found no matches. Exhaustive built-binary/deployed-JS and logs/analytics leakage remain UNVERIFIED. No raw customer/provider logs were retrieved.

## Razorpay — FAILED source contract / BLOCKED external payment

Live GET /api/billing/plans: 200, configured:false, three null plan IDs. Linked Railway project lists production only; no usable isolated test environment was identified. No subscription or charge created.

Live empty-JSON probes:
- POST /api/billing/webhook with invalid signature: 401 Unauthorized.
- POST /api/billing/revenuecat-webhook: 401 Unauthorized.
- POST /api/billing/subscription and /reconcile without auth: 401 Missing or invalid authorization header.

These prove route reachability/rejection, not configured payment processing. Separate in-memory test with configured dummy webhook secret also rejected invalid signature with 401.

**FAILED: event identity collision.** backend/routes/billing.py:398 takes payload.id or event_type:created_at and ignores X-Razorpay-Event-Id. Isolated SQLite reproduction used signed subscription.activated payloads with same created_at, no top-level id, different subscription IDs and distinct evt_release_a/evt_release_b headers. First: 200/ok; exact retry: 200/duplicate; distinct second: **200/duplicate**. Only one audit row. A real second subscription can miss entitlement. [Razorpay's documented event-ID header](https://razorpay.com/docs/webhooks/validate-test/). Requires backend fix and regression coverage before enabling payment.

Reproduction environment: DATABASE_URL=sqlite://, SUPABASE_DATABASE_URL empty, SENTRY_DSN empty, dummy RAZORPAY_WEBHOOK_SECRET; import backend conftest before app. Post JSON with event=subscription.activated, created_at=1788652800, payload.subscription.entity.id=sub_release_a/b; HMAC-SHA256 exact serialized bytes with dummy secret; set X-Razorpay-Event-Id header. No production DB/provider writes.

**FAILED requested recovery/verification contract:** web ProUpsell.tsx:136 ignores callback signature/IDs and polls backend status. Browser success alone does not grant Pro (VERIFIED IN SOURCE), but authenticated Razorpay callback verification is absent. Backend /billing/reconcile queries RevenueCat only and cannot recover a missed Razorpay webhook. Complete verified-payment/reconciliation/restored-Pro flow remains UNVERIFIED.

Owner action: securely configure authorized isolated Razorpay Test Mode/staging and a test user, including RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET, RAZORPAY_PLAN_ID_PILOT, RAZORPAY_PLAN_ID_PRO, RAZORPAY_PLAN_ID_FAMILY and test webhook destination. Fix event identity and required verification/recovery first. Do not put secrets in chat, switch production to test credentials, or initiate real charges.

## Public endpoints — VERIFIED observations

Requests disabled automatic redirects; no Location header on any response.

| URL | HTTP | Content-Type |
|---|---|---|
| https://aritomo.in | 200 | text/html; charset=utf-8 |
| https://aritomo.in/support | 200 | text/html; charset=utf-8 |
| https://aritomo.in/privacy | 200 | text/html; charset=utf-8 |
| https://aritomo.in/terms | 200 | text/html; charset=utf-8 |
| https://aritomo.in/.well-known/assetlinks.json | 200 | application/json; charset=utf-8 |
| https://aritomo.in/.well-known/apple-app-site-association | **404** | text/html; charset=utf-8 |
| https://web-production-7c65f.up.railway.app/api/health | 200 | application/json |

Android JSON parses: delegate_permission/common.handle_all_urls, android_app, com.pinegrass.ari, upload fingerprint above. Apple AASA absent; device association not verified.

## Commands / next checkpoint

EAS: whoami, project:info, build:view <id> --json; build:list --platform ios/android --build-profile production --limit 5 --json --non-interactive; submit:list --platform all --limit 10 --json --non-interactive; build:version:get --platform ios/android --profile production --non-interactive; credentials --platform ios/android (view only).
Railway: whoami, status --json (deployment fields), variables --service web --json (names/presence only). SQL: information_schema physical column comparison, pg_indexes, supabase_migrations.schema_migrations SELECTs with default_transaction_read_only enabled.
GitHub: workflow API, run list/jobs metadata, secret names. ADB: devices, filtered dumpsys package, pm get-app-links.
Artifact: HTTP HEAD/download, Get-FileHash SHA256, Python zipfile.testzip, embedded PKCS7 certificate fingerprint, jarsigner -verify.

Next: owner grants Play test permissions/Play signing fingerprint and completes Apple access; fix/test backend Razorpay event identity and implement requested recovery contract in owning repos; configure isolated test rail/RevenueCat server settings; establish running Railway revision through explicit release workflow if necessary; publish verified association IDs and exercise actual store installations. No external success may be inferred from local gates.
