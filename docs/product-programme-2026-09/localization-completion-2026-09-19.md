# Secondary mobile localization and delivery-open client

Local implementation only. No device, provider, deployment or notification gate changed.

## App-owned copy and accessibility

- Notification permission alerts and explicit test notifications now follow the current app language. Existing local reminder schedules and server gates are unchanged.
- Shared-group listing, create/join controls, field labels and member counts use English/Hindi copy. User-authored group names remain untouched. List failure now offers a localized retry rather than incorrectly showing an empty account. Create/join failures use bounded app-owned copy rather than raw provider/server exception text; drafts survive failure.
- Bank-link overview localizes loading, unavailable/error states, status and date prefixes, action labels and screen-reader consent labels. Unknown provider statuses use an app-owned unknown label; account identifiers remain untouched.
- Bank-consent UI localizes form/checkbox labels, waiting states and alerts; failed requests do not render raw provider exceptions. Timeout copy now correctly says to reopen the bank screen later instead of promising background polling after polling has stopped. Permission duration/revocation copy directs the user to provider options rather than claiming an unimplemented Ari Settings revocation action.

## Delivery attribution client

`trackNotificationOpen` accepts only a UUID-shaped server `measurementDeliveryId`, explicit current consent epoch and non-private collection state. It posts exactly delivery ID and epoch to `/measurement/v2/notification-open`. It has one immediate transient retry with the same body and no persistent queue. A single startup-only marker can wait up to 30 seconds for successful restored-session identity validation, initialized privacy state and existing server consent. Interactive login, logout, account change, private-mode choice or a consent UI change discards it; later opt-in/reconsent never replays it. Server ownership/current-epoch/age checks and first-open deduplication remain authoritative. Generic inbox interactions and local reminders do not become delivery-open counts.

The app response handler ignores an immediately repeated identical notification/action response before both routing and attribution. Changing private mode advances measurement generation, preventing retry even after a private-on/private-off cycle. Cold-start taps outside that bounded restore window remain unmeasured. The backend still rejects markers from another account, consent epoch or retention window.

## Remaining acceptance and engineering boundaries

This is not full Hindi acceptance. Provider-hosted pages and custom/user-authored values remain outside app-owned translation. Group settlement is handled by the separate group-flow lane. Bank detail and the main accountant forms/cards now have additional app-owned copy coverage; this does not prove every runtime/provider string is translated. This pass did not translate user/provider data or certify financial/legal translation accuracy. Native Hindi reading, Devanagari/font scaling and assistive-technology acceptance remain pending under the device hold. Public web now has a static /hi landing page with Hindi server-rendered copy, heading/main language, metadata, reciprocal alternate links and locale-route switching. The shared server html shell remains English until hydration; the Hindi content has an explicit language wrapper. Legal pages were not translated, and full authenticated/secondary web acceptance remains separate.

Additional mobile changes: shared Input inherits its visible label as accessible name while preserving explicit overrides; password visibility is localized and error banners announce alerts. Tax-estimator field/choice/accordion labels and app-owned errors are localized without changing calculation engines. Savings-goal fields/icon choices/errors are localized; failed loads offer retry rather than falsely empty results, and failed contribution/deletion is visible.

Integrated checkpoint before the later bank/accountant/privacy follow-up: full mobile suite595tests/56suites passes, including restored-session binding, cold-start tap expiry, consent/account/privacy changes and later normal collection after discarded boot taps. The same checkpoint web suite120tests/10files, TypeScript and scoped lint pass. Next production build generated15static pages. Direct inspection of generated index/hi HTML confirmed the corresponding English/Hindi title and H1, main language and alternate-language links. Initial group run hit the old5-second timeout under heavy parallel load; the20-second suite convention and rerun passed. No human Hindi or native-device acceptance is claimed.


## Follow-up across 19–20 September

Bank consent detail now localizes statuses, supported account-type labels, imported/duplicate counts and sanitized sync errors. Savings goal cards expose named edit/delete/contribute actions, localized remaining-day and completion messages. Budget and P&L failures explicitly offer retry rather than rendering an empty account/report. Budget month labels, rollover/form/card copy, P&L period/month labels and SmartLedger filter/alert/date copy follow the app language. Custom account, group, category and entry content is preserved. P&L net chart labels now use the shared amount formatter; private net labels no longer expose numeric values or a sign prefix. No tax engine/rates or forecast calculations were changed.

Ten focused tests across secondary-failure/private-P&L and existing SmartLedger suites passed, followed by mobile types and scoped lint. The private-P&L test initially supplied an invalid null trends fixture; corrected to the API's trends object, then passed. This is a test-fixture correction, not evidence of a production null response.

Web privacy/account-deletion content is now based on current implementation: first-party account-linked opt-in90day measurement (including delivery and verified billing attribution), minimal consent state, device-private versus account-level consent distinction; speech service may be network-backed; configured Sentry may include mobile user ID/name/email; configured AI provider receives relevant text/context. Removed claims of universal diagnostic redaction, PostHog collection, guaranteed on-device transcription, fixed backup-erasure dates, certified provider contracts or an available Google reauthentication deletion prompt. No legal compliance/translation certification is claimed. English legal content declares its language even when navigation preferences are Hindi. Corresponding backend policy is owned by the root integration lane.


### September 20 follow-up: core copy and factual privacy

Localized Invite Friends, daily heatmap labels and voice failure messages. Voice uses the selected recognition language; raw platform errors are no longer surfaced. Heatmap load errors have retry and private amounts remain masked. Tax engine names use stable translated app copy without changing calculations.

Embedded mobile Privacy Policy now reflects the implemented first-party optional measurement, 90-day event retention, account-level consent versus device Private Mode, configured diagnostics, voice/AI processing and deletion limitations. English policy text is explicitly labelled; this does not claim human-approved Hindi legal translation. Web privacy and deletion pages received the same factual alignment. Removed unsupported PostHog, on-device-only speech, automatic PII scrubbing, provider-contract and guaranteed backup-deletion assertions.

Shared input, type selector, country selector controls, AI confirmation, error boundary, coaching, engagement and dashboard/trends widget labels now use the language catalog. Error Boundary no longer promises that data is safe or an error was reported. AI confirmation no longer presents a parser score as calibrated certainty. Upcoming charge amounts now use Private Mode formatting, with fully localized due labels.

Earlier source inventory contained 186 literal candidates across 27 mobile files; the current JSON has been regenerated after closure. This heuristic includes intentionally English legal text, brands/identifiers and errors already translated at render. At this earlier checkpoint, remaining app-owned areas were Manage Categories, Todo Notes, About, Help/Support, some Settings text, group/VPA widgets and country names. All are implemented by the later closure checkpoint below. Server-generated prose and user-authored names are not blindly translated. Therefore this evidence does not claim complete Hindi acceptance.

Latest web verification after factual policy changes: 120 tests across 10 files, TypeScript, scoped ESLint and production build (15 static pages) pass. Latest voice and failure-state focused mobile checks: 7 tests across 2 suites pass. Latest widget/mobile-policy TypeScript and scoped ESLint pass; full integrated mobile regression is being recorded separately after completion.

Integrated mobile checkpoint after widget and privacy changes: **635 tests / 63 suites pass**, TypeScript passes. Latest widget/policy scoped ESLint has zero warnings/errors. No device/provider/release verification was performed.


### Secondary-copy closure and source audit, September 20

The previously listed app-owned copy surfaces are now implemented: Manage Categories, Todo Notes, About, Help/Support, Settings non-deletion alerts, country names, group balance/VPA, shared capture, onboarding splash, budget/streak widgets, transaction/delete accessibility and trend month labels. App-owned static calls to `phrase` / `localizeCopy` in screens, components and hooks were scanned; no missing Hindi mappings remain after the three final omissions were added. Raw JSX text outside legal screens consists of brand/domain/UPI format examples. This is a source audit, not a claim that arbitrary provider or user text is translated or that human Hindi acceptance is complete. Legal bilingual conversion is implemented by the billing agent; the earlier English-only exception is superseded.

Truthful behavior fixes: notes failure has Retry instead of a false empty list; note update rollback is visible; categories and VPA save/delete errors are sanitized. About/Help/Splash avoid specific investment-advice and guaranteed-security claims; outdated twice-weekly notification and guaranteed support-response claims were removed. iPhone rating no longer opens an invented store ID. The shared language hook now returns stable callbacks so translated fetch dependencies cannot cause repeated fetch loops.

Shared capture preserves decimal parsed amounts (previously rounded away), uses currency/privacy-aware display, and does not display raw save failures. AddTransaction clears its delayed post-save navigation on unmount: the full regression exposed a stale timer navigating a later screen. The failure assertion was preserved; independent three-test usability suite passes after the fix. New notes/categories/share-capture regression cases: four tests across two suites pass. Post-await mounted/generation guards also prevent either transaction screen from navigating after an in-flight save resolves after dismissal. Both cases have regression tests.


## Final source checkpoint

Core app-owned copy gaps identified in this pass are implemented. The final mobile source inventory contains 77 candidates across 17 files: bilingual legal English branches, brand/domain and technical format examples, and error source identifiers translated when rendered. Built-in category labels and date grouping now honor Hindi, while custom category names stay unchanged. Human review of Hindi meaning, wrapping, font scaling and assistive technology remains pending; provider-hosted pages and user-authored content are separate from app-owned copy.

Final integrated mobile verification: **678 tests / 68 suites pass**, TypeScript passes, and ESLint across changed/new mobile TypeScript files passes with **zero warnings or errors**. This includes legal render, consent/startup attribution, notification/bill account ownership, and dismissed-screen save completion regressions. No device, provider, production deployment or notification enablement occurred.

Final web verification including bilingual Privacy, Terms, Account Deletion and Support: **120 tests / 10 files pass**, TypeScript and ESLint across changed/new TypeScript files pass, and production build generates **15 static pages**. Mobile and web `git diff --check` pass. These are local candidates, not deployed artifacts.
