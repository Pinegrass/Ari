# Ari Android release checkpoint — 2026-09-08

Status: **PARTIAL VERIFIED; INTERNAL DRAFT SAVED; ROLLOUT BLOCKED ON DEVICE TEST COMPLETION.**

## Scope and repositories

User requested Google Play release of the latest best candidate, with connected-device testing first. Existing internal-first release scope retained. No production rollout or service-account permission change was performed.

Exact unchanged master HEADs:
- Mobile: 3e00ee520af3801c3b537d85b2ca89cb5fcbee0a (2 ahead/0 behind fetched origin/master).
- Backend: b3dc6589e7c08c424d005d1ac17ff5f4c96de753.
- Canonical nested web: be5f32a2deeb8f2cfa1b2a1b9913bb9340b5ef87.

Existing Sept 6 parent continuity/report changes preserved. Backend untouched. Web has one new uncommitted assetlinks correction. No mobile application code changes or full-suite reruns; proportional JSON validation and git diff --check passed.

## Candidate selection — VERIFIED

EAS production list still identifies edc6a6ad-8c5e-4bc6-ac5e-a3d29d5dc142, 1.3.0/code55, FINISHED, source 7aeb65c797695ac97edb47a5cfcc7246bcb9b736. No application-source delta from this commit to current HEAD. Newer code56 artifacts are preview or e2e; e2e targets x86_64 and bypasses RevenueCat gating, so it is not the release candidate.

Existing AAB:
D:/Codex/Artifacts/Ari/2026-09-06/ari-1.3.0-v55.aab
SHA256: 4530F53A81532E1B035A494D6C71E7C5C6552140788ACB101A50245688986850

Downloaded official google/bundletool 1.18.3. Bundle validation succeeded. Generated device APK set using existing upload keystore, without creating/rotating credentials:
D:/Codex/Artifacts/Ari/2026-09-08/ari-v55-device.apks

Temporary password files were removed after signing; no password values were printed. Existing installed code47 base APK was copied to installed-v47-base.apk as an artifact backup (not an account-data backup).

## Connected device — partial VERIFIED

Samsung SM_M166P, arm64, serial R9ZY6046FML. Existing package com.pinegrass.ari code47/1.2.0 used the same upload certificate. bundletool install-apks upgraded it to code55/1.3.0 without clearing data or uninstalling. Confirmed package version and lastUpdateTime.

Passed observed checks on Ari:
- Launch and native activity open.
- Existing authenticated session/profile retained.
- Home renders.
- Settings renders.
- Accountant toolkit navigation renders.
- Trends/report screen and chart/category summaries render.
- Notification permission already granted (delivery not tested).
- pm get-app-links reports aritomo.in verified for this upload-signed installation.
- No com.pinegrass.ari crash blocks in the available crash buffer (not proof of crash-reporting delivery).

During subsequent entry testing, foreground changed to **com.pinegrass.gani.qa**, including its DevLauncherErrorActivity and later MainActivity. A project-load timeout belonged to Gani QA, NOT Ari. Testing stopped to avoid operating another app. User was asked asynchronously to pause other phone testing and reserve the device; no answer was received at checkpoint time.

No test ledger entry was created. Fresh email/Google sign-in, entry create/edit/delete, notifications delivery, invite opening, RevenueCat purchase/restore and further cold-launch checks remain UNVERIFIED. Do not describe these as passed. Device currently remains under the other app's use; do not steal its foreground until available.

Helper/artifacts under D:/Codex/Artifacts/Ari/2026-09-08 include device_state.py, window.xml, device.png, bundletool jar, old base APK and generated APK set. UI captures may contain account information: do not commit or publish them. The helper must be used only after verifying foreground is com.pinegrass.ari; the phone was shared during this run.

## Google Play Console — VERIFIED browser access and saved draft

Signed-in browser account has access to Pinegrass Tech developer 6105111822527199684, Ari app 4976196941164461169. Browser access removes the prior practical submission blocker without changing denied service-account permissions.

Before changes:
- Production release 51 (1.3.0), released 24 Aug, 10% rollout.
- Internal track release 1.0.1 (5), available to testers since 11 Jun.
- No unpublished changes.

Created internal testing release draft **4** on track **4701618176600354245**. Uploaded the exact v55 AAB; Play parsed it as 55 (1.3.0), min API24, target36, four ABIs, with native debug symbols. Set name:
1.3.0 (55) - device validation

en-GB notes:
Internal validation candidate for Ari 1.3.0. Testing finance tracking, reports and account flows before broader release.

Clicked Save as draft; form reloaded with the saved artifact/name, disabled Save as draft/Discard changes and available Next.
Draft URL:
https://play.google.com/console/u/0/developers/6105111822527199684/app/4976196941164461169/tracks/4701618176600354245/releases/4/prepare

No Next/rollout confirmation was performed. No production release was changed. Finish device tests, inspect Play validation warnings/errors, and only then publish the internal release. Do not create a duplicate draft or paid build.

## Play signing / links — VERIFIED defect; source correction prepared

Play Console → Protected with Play → Play Store protection details → Manage Play app signing.
Observed digital-asset-link snippet identifies actual Play signing SHA256:
96:25:D8:77:C7:A3:76:78:A1:28:9D:34:51:D3:7C:B9:6F:E8:E8:7E:AA:D7:AF:6E:01:A8:AA:8B:92:A4:B8:44

Upload SHA256 remains:
BB:96:A3:A1:AB:99:AE:98:57:BE:3E:E0:87:D2:34:C1:9A:47:06:52:D4:26:DE:4B:94:FA:C9:5A:86:D9:27:F0

These differ. Live https://aritomo.in/.well-known/assetlinks.json lacks the Play fingerprint; the upload-signed device's verified link state cannot validate Play installs.

Added Play fingerprint alongside upload fingerprint in canonical web public/.well-known/assetlinks.json. JSON/package/two valid 32-byte fingerprint checks passed, as did git diff --check. **Not committed, pushed or deployed.** Publish via the web release workflow and recheck live content before calling Play-installed invite links verified.

## Next executable action

After the owner confirms exclusive device availability, foreground Ari and verify package before every action. Complete cold launch, entry round trip with cleanup, auth/Google sign-in, reports, notification/invite and entitlement checks within authorized test scope. Finish relevant release blockers. Resume existing Play internal draft4, review validation, then roll out internally. Production remains at its existing rollout until separately handled.

Earlier iOS/Razorpay/backend-revision blockers from docs/release-verification-2026-09-06.md remain; this Android continuation did not resolve them.
