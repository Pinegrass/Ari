# Android release regression flows

This candidate passed core journeys in run44938263716, report/privacy checks in
44940046041, and Arabic restart/persistence in44940729174. The verified EAS artifact
is541b5b79-fa8a-4dac-bdbc-5d808860b164. These checks cover the new native candidate;
they do not establish installed-version57 OTA canary acceptance.

The workflow uses the e2e release APK and an API34 AOSP x86_64 emulator. Draft PRs
skip automatic native builds. Manual dispatch accepts a finished build_id and
scenario all/reports/languages. Reuse an artifact only when application source,
native configuration and lockfile match; flow/documentation-only changes do not
require rebuilding. Nightly tests reuse unexpired finished builds for the exact
source commit.

Scenarios always start with login. The full suite covers:

- Onboarding and demo sign-in.
- Tabs, the Accountant hub and transaction trends.
- Transaction entry and edit.
- Tomo conversation rendering.
- Export navigation and return.
- Weekly/monthly report navigation, personal habits and Private Mode.
- Arabic switch/restart/persistence, RTL screenshots and English restoration.

The demo account persists server-side; entry flows add/edit demo records. The
e2e profile's MAESTRO flag is test-only and must not become production entitlement
truth. Ari's worldwide candidate remains free; server-verified entitlements and
payment-provider reconciliation remain independent contracts.

First launch may show onboarding and a software-rendered launcher ANR. The flows
skip onboarding and handle the known dialog. Wait for animated content; prefer
accessibility labels for back buttons and switches. Scroll to targets in Settings
and Home. AOSP default images avoid the heavier Google launcher. The workflow
pins driver startup timeout, waits for boot and uploads logs/screenshots on failure.

Read docs/audits/2026-11-22/navigation-reports-release.md for remaining launch gates.
Native smoke does not establish translation fluency, legal acceptance, scheduled
report delivery, backend staging correctness or worldwide currency coverage.
