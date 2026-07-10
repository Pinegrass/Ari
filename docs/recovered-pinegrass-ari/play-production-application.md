# Ari — Google Play production-access application

Reference for filling out **Play Console → Release → Production → Apply for production access**, post the 14-day closed-testing window.

> **Honesty rules for this doc:**
>
> 1. Every factual claim about testers, recruitment, feedback, and content rating must be filled in by Augustus or the Pinegrass team. AI has not invented any of these.
> 2. Items marked `[FILL IN: ...]` require human input before the form can be submitted to Google.
> 3. The "Post-test fixes" section (§7) reflects internal QA + Codex code audit work, **not** tester-reported issues. Do not re-frame these as tester feedback when answering Google's form.

---

## 1. App overview

- **Name:** Ari
- **Package:** `com.pinegrass.ari`
- **Publisher:** Pinegrass
- **Category:** Finance
- **Positioning:** Personal money assistant — track what you spend, save, and have left, without a spreadsheet.

## 2. Why the app is ready for production

- Closed testing release published in Play Console.
- 12+ active testers across the closed-testing track.
- Closed testing ran for 14+ days.
- All three Play closed-testing gates satisfied (published, 12+ testers, 14 days).
- Post-test fixes (see §7) shipped in this build, addressing issues surfaced by internal QA + a Codex code audit conducted after the closed-test window.

## 3. How testers were recruited

[FILL IN: specific channels — e.g. "friends and family of the Pinegrass team," "Reddit (r/expo, r/reactnative) call for testers," "private email list," "Twitter/X DM asks," "in-person at a Nairobi tech meetup," etc. Google occasionally asks for an approximate breakdown by channel.]

[FILL IN: number of testers actually active during the 14-day window. Google requires ≥ 12 — confirm the live count, since some testers may have opted out mid-window.]

## 4. Testing approach

[FILL IN: did testers receive a written test plan / checklist, or was it open exploration? If structured, summarize the test plan in 2–3 sentences. If open, say so explicitly — Google accepts both. Do not invent a structured plan if it was open exploration.]

## 5. Feedback — what was collected and how

**Channel(s) used to collect feedback:** [FILL IN: e.g. Play Console internal feedback, email to support@pinegrass.app, Telegram/WhatsApp group, in-app feedback button, 1:1 calls. If multiple channels were used, list them.]

**Volume of feedback received:** [FILL IN: number of feedback items / reports / messages. If "very little," say so honestly.]

**Themes that emerged:** [FILL IN: bullet 3–5 themes if any. e.g. "onboarding wasn't clear," "Google sign-in failed on some devices," "missing budget feature," etc. If no substantive feedback came in, say so honestly — Google does not penalize *"12 active testers, no critical issues reported"* as long as it's true.]

**Verbatim examples we can quote:** [FILL IN: pull 1–2 short quotes if you have any, with the tester's permission. Optional but strengthens the application.]

## 6. Changes made based on tester feedback

[FILL IN: list of changes traceable to tester reports. If no changes were made based on tester feedback specifically, say so. The four fixes in §7 below were **not** user-reported and should not be listed here.]

If no tester-reported changes shipped: keep this section short and factual (*"No tester-reported issues required code changes during the closed-test window"*). Do not pad. Google's reviewers can tell when this section is filler.

## 7. Post-test fixes shipped in this build (NOT user-reported)

After the closed-test window closed, an internal QA pass plus a Codex code audit identified four issues. All four are fixed in commit `8ce9903`, which is the build being submitted for production. **None of these issues were reported by testers** — they were surfaced by code review and internal device testing.

| # | Fix | Why it matters |
|---|---|---|
| 1 | **Session persistence hardening** — session is no longer wiped when a background data-fetch returns 401 | Previously, a transient 401 on a background sync could log the user out unexpectedly. Now the session is preserved and the request is retried via the refresh-token flow. |
| 2 | **Theme palette refinement** — splash, adaptive icon, and central theme colors moved from near-black/navy to a dark teal tint | Brand polish before public launch; the prior palette read as off-brand in side-by-side review. |
| 3 | **Paywall hook-order lint fix** — React hook-order error in the paywall component | The component would have crashed on certain re-render paths. Caught by lint + audit before reaching users. |
| 4 | **Local calendar date handling** — transactions no longer slip one day due to UTC ISO formatting | Users in non-UTC time zones would have seen a transaction logged "yesterday" if entered late at night. Fix uses local calendar date, not UTC ISO string. |

**Suggested phrasing if Google's form asks "what changes did you make?":**

> Following the closed-test window, an internal QA pass and a code audit identified four issues that were fixed in the production-candidate build. These were not surfaced by testers but by internal review: (1) session persistence under background 401s, (2) theme palette refinement, (3) a paywall hook-order lint error, (4) timezone-correct transaction dates.

If the form has separate fields for "tester-reported" vs. "other improvements," put the §6 content in the first field and §7 in the second. Do not mix them.

## 8. Age and audience confirmation

**Target audience:** 18+ (Ari handles personal financial data; v1 treats this as an adult-only audience.)

**Tester age confirmation:** [FILL IN: confirm all testers were 18+ if the closed test had no formal age check. If testers self-confirmed 18+ via recruitment messaging, note that. Do not claim formal age verification if it was not actually performed.]

## 9. Content rating

- **IARC questionnaire status:** [FILL IN: completed / pending in Play Console → App content → Content rating.]
- **Resulting rating(s):** [FILL IN: e.g. ESRB Everyone, PEGI 3, IARC Generic 3+. Most non-violent finance apps come back at the lowest tier.]

If not yet completed, the IARC questionnaire must be done in Play Console before the production-access application can be submitted.

## 10. Compliance — policy items required for production

| Requirement | Status | Owner |
|---|---|---|
| Privacy policy live at a stable URL | [FILL IN: URL + live yes/no — draft in PR #1 `docs/legal/privacy-policy.md`] | Pinegrass |
| Privacy policy URL set in Play Console → App content | [FILL IN: yes/no] | Pinegrass |
| Account deletion — in-app path (Settings → Delete account) | UI drafted in PR #1 (`src/screens/Settings/DeleteAccountScreen.tsx`). [FILL IN: integrated into shipped build yes/no] | Dev |
| Account deletion — public web URL | Drafted in PR #1 (`docs/web/account-deletion-request.html`). [FILL IN: deployed URL + live yes/no] | Dev |
| Account deletion URL set in Play Console | [FILL IN: yes/no] | Pinegrass |
| Backend `DELETE /api/account` endpoint implemented | Spec in PR #1 (`docs/backend/delete-account-endpoint.md`). [FILL IN: implemented yes/no, endpoint live yes/no] | Backend dev |
| Data Safety form completed in Play Console | [FILL IN: completed yes/no, last updated date] | Pinegrass |
| Data Safety form matches actual data flows (no false claims) | [FILL IN: reconciled against the privacy policy yes/no] | Pinegrass |
| Ads disclosure | [FILL IN: confirm "no ads in v1" or specify if present.] | Pinegrass |
| In-app purchases / subscriptions disclosure | [FILL IN: present? If yes, declare in Data Safety and link product listings.] | Pinegrass |
| Target SDK level meets current Play requirement | [FILL IN: verify against current Play target-SDK requirement at submission time.] | Dev |

## 11. Build identity for this submission

- **Build commit:** `8ce9903` (post-test fixes)
- **versionCode (Android):** [FILL IN — see §12 below for the recommended bump strategy]
- **version string:** [FILL IN — e.g. `1.0.1`]
- **EAS build profile:** `production` (AAB output)
- **Track:** Production

## 12. versionCode planning — avoid Play rejections

Bumping rules to avoid version-collision rejections from Play:

| Build | versionCode | Purpose |
|---|---|---|
| Closed-test build (already on Play) | `N` (current on Play) | Reference baseline |
| Preview APK (smoke test, signed with production keystore) | `N + 1` | Sideloaded for Augustus's device test, 2–3 days |
| Production AAB (Play submission) | `N + 2` | The build that goes to Play production |

**Why preview gets its own bump:** if the smoke test catches anything and a second preview is needed, that one is `N + 3`, and the production AAB becomes `N + 4` (or higher). Always keep the production AAB's `versionCode` strictly greater than any preview ever cut from the same project. Play will reject any submission whose `versionCode` is equal to or less than something it has already accepted in any track.

## 13. Open items / risks to clear before submitting

- [ ] Privacy policy published at a stable URL.
- [ ] Account deletion backend endpoint (`DELETE /api/account`) live.
- [ ] Account deletion web URL live and linked in Play Console.
- [ ] Data Safety form reconciled against the privacy policy.
- [ ] IARC content rating completed.
- [ ] 2–3 day smoke test of preview APK passed without blocker bugs.
- [ ] Sentry release tagged for the production AAB's `versionCode`.
- [ ] At least one human on-call for the 4 hours following rollout.

## 14. After submission

- Google's production-access review for a closed-testing graduate is typically 1–7 days. Sometimes longer for finance-category apps. Plan accordingly.
- Do not announce launch dates publicly until Google has approved production access.
- If Google requests more information, respond within 24 hours — delayed responses extend the review.
- The launch-day runbook (`docs/runbooks/launch-day.md`) covers the rollout itself once production access is granted.
