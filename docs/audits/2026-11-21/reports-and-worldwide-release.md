# Personal reports and worldwide release

Checked on 21 November 2026. Ari remains free. Google Play reports production
1.3.0 (57), completed. The six-language candidate is still an open draft in
mobile PR #10.

## Implemented report changes

Source `05b10c43a89506e0af50143781ae7e24ce38e3ba` adds personal habit
suggestions to the existing periodic reports. Suggestions depend on the
recorded income, spending, category shares, transaction count and comparable
prior period. An empty ledger offers a first-entry action. A sparse prior
period cannot trigger a spending-trend suggestion. Days with recorded
activity are counted without inferring no-spend days.

Home has direct weekly and monthly review actions. Each habit links to
income entry, budgeting or the displayed period's entries. Private Mode
hides the personal habit summary. A failed refresh retains the loaded report
and offers retry. Weekly and monthly push taps open the report inbox, whose
items carry the actual review dates.

New interface copy covers English, Hindi, Spanish, French, Brazilian
Portuguese and Arabic. The client requests English explanations for the four
new languages because the live report API only accepts English and Hindi.
The screen discloses this partial language coverage.

The full suite passed 707 tests before the final refresh-recovery change.
The final report, language and notification checks passed 33 tests.
TypeScript and lint pass. Android JavaScript bundling also passed.

## OTA compatibility

The exact public Play artifact is EAS build
`babe43bf-4a4f-4dc9-aacf-c9e31eb27841`, version code 57.
Its source metadata identifies `4b4ae8e0a5139e3cfb3b61d80d9e4124f6cdb15c`.
The AAB manifest targets Android API 36 and embeds the following update target.

- Project `ae18eabf-124f-4b0a-a09e-a2a40dfb473b`
- Android channel `internal-release`
- Runtime `84cc28590bb0a1fffcf4a346d97bd40e18faac45`

Despite the channel name, this artifact is the public production release.
A direct update request using its platform, channel and runtime returned
HTTP 204, meaning no compatible update was offered during this check.

The report logic is JavaScript and uses existing app capabilities. A report
patch can use OTA after it is built and verified against that installed native
runtime. The current worldwide branch also adds expo-localization, changes
native RTL configuration and updates native packages. Those changes require
a new Play binary. This branch cannot be published wholesale to runtime
`84cc2859` by overriding the fingerprint.

No OTA or Play submission was published in this check.
[Expo runtime compatibility](https://docs.expo.dev/eas-update/runtime-versions/)

## Live services and delivery

Backend API health is healthy at
`fdd03c4db0871521335c04a24d2c65e76f50f97b`.
The receipt worker recorded 49 successful runs in the preceding 24 hours.
A read-only readiness inspection passed health, deployed revision and
receipt freshness. It failed the 30-hour maintenance threshold at about
1,918 minutes.

GitHub readiness run `44929664822` failed before running any job steps.
Its annotation reports failed account payments or an insufficient spending
limit. This is a provider billing gate. Scheduled weekly jobs and independent
readiness need normal GitHub Actions operation.
[GitHub run](https://github.com/Pinegrass/ari-backend/actions/runs/44929664822)

Only one weekly brief and one monthly review exist in the live coaching cache.
Their most recent generation dates are 20 September and 1 September,
respectively. Thus automatic personal report generation and reminder
delivery cannot be claimed as current. On-demand ledger reports remain
independent of the AI provider.

Daily and deferred notification sending flags are false. The monthly Railway
worker is scheduled for the first day of each month at 09:00 IST. Its next
scheduled production acceptance is 1 December.

## Remaining worldwide gates

The dependency audit still contains seven high findings through navigation's
query decoder, plus six moderate production findings. The earlier Maestro job
failed while waiting for an EAS cloud build. Native report and Arabic layout
acceptance remain open.

The ledger contract covers India, the US, the UK and Australia. Additional
country/currency support, complete localized explanations and legal text,
translation review, signup email verification and matching Play listing
claims remain part of the worldwide release work.

The canonical mobile and nested web checkouts contain separate uncommitted
work. This candidate preserves those changes. The checked source points are
mobile candidate `05b10c4`, backend remote master `fdd03c4`, and web remote
master `f87145694db3ba7f5c3c66595ffe9b7fcff74265`.
