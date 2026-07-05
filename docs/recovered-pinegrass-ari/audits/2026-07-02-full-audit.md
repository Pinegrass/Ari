# Ari — Multi-Dimensional Audit (2026-07-02)

Conducted by Pinegrass Tech engineering. Scope: all of `src/` (11 files), `scripts/find-hardcoded-colors.sh`, `.github/workflows/ci.yml`, `README.md`, and all files under `docs/`. Contrast ratios were computed from the actual hex values; the type-safety finding was verified with `tsc --strict` against the real `tokens.ts`.

## Grades summary

| Dimension | Grade | One-line justification |
|---|---|---|
| Code | **C** | Clean, idiomatic RN, but the scaffold verifiably fails strict typecheck, has an Android pager-index bug, and nothing is ever compiled or tested. |
| Security | **B+** | No secrets, correct AsyncStorage scoping, sanitized error copy; only hardening gaps (breadcrumb scrubbing, deletion-form abuse controls). |
| User flow | **B** | Tight 3-step flow with correct skip/gating mechanics, marred by an intent-less `onComplete` contract and undocumented Android backup-restore behavior. |
| System design | **B-** | Right two-tier token architecture and bounded context re-renders, but the central light/dark type contract is unenforced (and broken) and storage is hard-wired. |
| UI/UX | **C+** | Excellent light-mode ramp and scales, but 4 measured contrast failures including an invisible disabled destructive button and a failing dark-mode primary CTA. |

## Top 3 actions

1. **Make the scaffold provably compile**: replace `ColorScheme = typeof light` with an explicit interface both palettes are declared against (fixes the verified `tsc --strict` error at `tokens.ts:57/89` → `ThemeProvider.tsx:66`), then add `package.json` + `tsconfig` + a real `tsc --noEmit` CI step so this class of bug can't ship again.
2. **Fix the four measured contrast failures**: dark-mode `text.onAccent` (2.54:1 on the primary CTA), the disabled delete button (1.23:1), the offline banner (2.15:1), and the enabled delete CTA (3.76:1) — all are one-line token/value changes.
3. **Harden the onboarding contract**: update `index` optimistically in `next()` (Android momentum-event gap) and change `onComplete()` to `onComplete(intent)` so the host app can route "Get started" vs "I already have an account" vs "Skip" differently — the current API makes the sign-in link a no-op affordance.

---

## 1. Code audit — Grade: C

*Idiomatic, readable RN code, but the scaffold fails strict typecheck as written, has an Android pager state bug, and ships with zero tests and a no-op CI.*

| Sev | Location | Issue | Recommendation |
|---|---|---|---|
| **High** | `src/theme/tokens.ts:57,89` + `src/theme/ThemeProvider.tsx:66` | **Verified compile failure**: `ColorScheme = typeof light` with `as const` produces literal types (e.g. `overlay: "rgba(15, 23, 42, 0.5)"`), so `colors.dark` is not assignable to `ColorScheme` — `tsc --strict` errors with `Type '"rgba(0, 0, 0, 0.6)"' is not assignable to type '"rgba(15, 23, 42, 0.5)"'`. The scaffold will break the build of any strict-TS app it's copied into. | Define an explicit `ColorScheme` interface (values typed `string`) and declare `const light: ColorScheme`, `const dark: ColorScheme` (or use `satisfies`), which also gains structural verification that dark covers every token. |
| **High** | `src/screens/Onboarding/OnboardingScreen.tsx:34–45` | `next()` relies on `onMomentumScrollEnd` to update `index`, but programmatic `scrollToIndex` does not reliably fire momentum events on Android — tap-only users can see the slide advance while `index`, the dots, and the "Next"/"Get started" label stay stale. | Set `setIndex(index + 1)` optimistically inside `next()`, or drive index from `onViewableItemsChanged` with a `viewabilityConfig`. |
| **Medium** | `src/theme/ThemeProvider.tsx:39–47` | Preference hydrates asynchronously after first render with no exposed "ready" flag, so a user who chose dark gets a flash of the `defaultPreference` theme on every cold start. | Expose a `hydrated` boolean in context (or hydrate before first paint) so the root can gate rendering alongside the splash. |
| **Medium** | `README.md` (integration step 4) | `if (seen === null) return null; // keep splash` is wrong for Expo — returning `null` does not keep the splash unless `SplashScreen.preventAutoHideAsync()` was called; users get a blank white frame on first launch. | Document the `expo-splash-screen` `preventAutoHideAsync`/`hideAsync` pairing in the gate snippet. |
| **Medium** | `src/api/account.ts:48–55` vs `docs/backend/delete-account-endpoint.md` ("404 … Treat as success on the client") | The client contradicts its own backend spec: `deleteAccount()` throws on any `!res.ok`, so an already-deleted user (404) sees an error instead of success. | Special-case 404 to resolve with `{ status: 'completed', completesAt: new Date().toISOString() }` or similar. |
| **Medium** | repo root; `.github/workflows/ci.yml:18–23` | There is no `package.json`/`tsconfig` and CI self-disables in "template mode," so nothing in this repo is ever compiled or tested — which is exactly how the High type error above shipped; `classifyError` and the storage modules are trivially unit-testable but have zero tests. | Add a minimal `package.json` + `tsconfig` + `tsc --noEmit` CI step, and Jest tests for `classifyError` and the onboarding gate. |
| **Low** | `src/theme/ThemeProvider.tsx:49–52,61–72` | `setPreference` is recreated every render and omitted from the `useMemo` deps (exhaustive-deps violation; the memoized context silently retains an old function reference). | Wrap `setPreference` in `useCallback` and add it to the deps array. |
| **Low** | `src/screens/Onboarding/OnboardingScreen.tsx:29–32` | Double-tapping "Get started"/"Skip" runs `finish()` twice and can invoke `onComplete` twice (host navigation may double-fire). | Guard with a `finishing` ref. |
| **Low** | `src/screens/Onboarding/OnboardingScreen.tsx:43,80` | Index and `getItemLayout` are derived from live window width; device rotation or foldable resize mid-flow corrupts paging offsets. | Lock orientation for this screen or recompute layout on dimension change. |
| **Low** | `src/errors/messages.ts:151–152` | HTTP 403 is classified as `auth.invalid_credentials` — 403 means forbidden, not bad credentials, so users get "double-check your password" for permission errors. | Map 403 to a distinct kind (or `unknown`), keep 401 for credential/session issues. |
| **Low** | `src/api/account.ts:50–54` | Throws a plain object instead of an `Error`, losing the stack trace that Sentry would otherwise capture. | Throw a custom `ApiError extends Error` carrying `status`. |
| **Low** | `README.md` ("What still needs a human" #3, Files table) | Doc drift: README calls `palette.brand500` "a reasonable default blue … `#2563EB`" but `tokens.ts:7` is emerald `#047857`; the Files table also omits 6 shipped source files (`OfflineBanner`, `sentry.ts`, `account.ts`, `errors/`, `DeleteAccountScreen`). | Update the README to match the code and list every file the scaffold ships. |
| **Low** | `src/screens/Onboarding/OnboardingScreen.tsx:53` | `StatusBar backgroundColor` is Android-only and deprecated under RN edge-to-edge (0.77+). | Prefer `expo-status-bar` and edge-to-edge-safe styling. |

Drop-in safety overall: imports are relative (good), storage keys are namespaced `@ari/` (good), but the README's `@/theme/useTheme` alias may not exist in the target project, and peer deps (`async-storage`, `netinfo`, `@sentry/react-native`) are referenced with no manifest pinning versions.

## 2. Security audit — Grade: B+

*Genuinely careful posture for a scaffold — no secrets, env-based DSN, non-sensitive-only AsyncStorage, canned error copy that never leaks server text. Findings are hardening-level.*

| Sev | Location | Issue | Recommendation |
|---|---|---|---|
| **Medium** | `docs/web/account-deletion-request.html:163–166` + `docs/backend/delete-account-endpoint.md` | The public deletion-request form POSTs arbitrary emails to the production endpoint with no rate-limit/captcha/CSRF guidance anywhere in the spec — an email-bombing and account-enumeration vector (confirmation-link design mitigates actual deletion, not abuse). | Add rate limiting + captcha requirements to the endpoint spec, and ensure the response is identical whether or not the email exists. |
| **Low** | `src/observability/sentry.ts:36–47` | `beforeSend` scrubs `Authorization`/`Cookie` only from `event.request.headers`, but auto-instrumented fetch data mostly lands in **breadcrumbs**, which are not scrubbed. | Add a `beforeBreadcrumb` hook (and/or `sendDefaultPii: false`) to scrub breadcrumb data too. |
| **Low** | `src/observability/sentry.ts:53–55` | `identifyUser` ships the user's email (PII) to Sentry, a third-party processor. | Send `id` only, or gate email on explicit consent; confirm the privacy policy's Sentry disclosure covers it (it currently does mention Sentry). |
| **Low** | `scripts/find-hardcoded-colors.sh:19–26` | `"$ROOT"` is passed to `grep` without a `--` separator, so a path beginning with `-` is parsed as an option (the `[ ! -d ]` check blocks most abuse; no real injection since everything is quoted and `set -euo pipefail` is set). | Add `--` before `"$ROOT"`. |
| **Low** | `docs/web/account-deletion-request.html:164`, `docs/runbooks/launch-day.md` | Raw Railway infrastructure hostname hardcoded in a public page and runbook — couples public artifacts to a mutable internal host. | Front with a custom domain (`api.pinegrass.app`) before deploying the form. |
| **Low** | `.github/workflows/ci.yml:13,25` | Actions pinned to mutable major tags (`@v4`), not commit SHAs; `--no-audit` also skips npm advisories. | Pin to SHAs; drop `--no-audit` or add a scheduled audit job. |

Positives worth recording: no hardcoded secrets anywhere; `.env*` gitignored; AsyncStorage stores only a boolean flag and a theme string (correct per OWASP MASVS-STORAGE — no tokens/credentials); `getUserMessage` guarantees server error text never reaches the UI. Dependency risk is unassessable (no lockfile) and inherited by the target app — acceptable for a scaffold but should be stated in the README.

## 3. User flow simplicity audit — Grade: B

*Three slides, persistent CTA, well-placed Skip, versioned gate key, dev reset helper, and a written verification checklist — a solid flow with two real design gaps.*

| Sev | Location | Issue | Recommendation |
|---|---|---|---|
| **High** | `src/screens/Onboarding/OnboardingScreen.tsx:19–21,123–129` | "I already have an account" is a false affordance: it calls the same `finish()` as "Get started" and Skip, and `onComplete: () => void` carries no intent — the host app cannot route returning users to sign-in vs. new users to sign-up. | Change the contract to `onComplete(intent: 'getStarted' \| 'existingAccount' \| 'skip')` and document the expected routing. |
| **Medium** | `src/storage/onboardingStorage.ts:3` | Re-install behavior is asymmetric and undocumented: Android Auto Backup restores AsyncStorage by default (reinstalling users silently skip onboarding), while iOS uninstall clears it (they see it again); the flag is also device-local, so existing users see onboarding on every new device. | Document the `android:allowBackup` interaction in the README and decide intentionally; consider excluding the key from backup or scoping the decision per-account after auth. |
| **Medium** | `src/screens/Onboarding/slides.ts:29` | Slide 3 promises "you never have to log in twice" — an absolute claim the app cannot keep (the error catalog itself contains `auth.session_expired`: "Please sign in again"), setting up a trust-breaking contradiction. | Soften to "Ari keeps you signed in" or similar non-absolute phrasing. |
| **Low** | `README.md` (gate snippet) | First-launch gate renders `null` (blank frame) while AsyncStorage resolves — a visible flash on the very first impression of the app (same root cause as the splash finding in the Code audit). | Hold the splash screen until `hasSeenOnboarding()` resolves. |
| **Low** | `src/screens/Onboarding/slides.ts:12–31` vs `README.md` | README twice says slide-1 copy is a placeholder pending the confirmed "what is Ari" one-liner, but the copy reads finished — ambiguous whether it's approved messaging. | Mark the copy's approval status explicitly in `slides.ts` or remove the placeholder warnings. |

Strengths: 3 steps is the right count; Skip visible on slides 1–2 with `hitSlop`, correctly replaced on slide 3; `Skip = finish` (marks seen) so skipping never re-traps the user; copy is concise, benefit-led, and jargon-free; `resetOnboarding()` and the README's 6-point verification checklist show real QA thinking.

## 4. System design audit — Grade: B-

*Correct two-tier token architecture (raw palette → semantic roles) with a sound context design, undermined by the broken type contract and hard-wired storage.*

| Sev | Location | Issue | Recommendation |
|---|---|---|---|
| **High** | `src/theme/tokens.ts:58,90,93` | The design intends `ColorScheme` as the contract both palettes satisfy, but deriving it from `typeof light` under `as const` means dark is never checked against it — and in fact fails it (see Code audit). The architecture's central invariant ("every token exists in both modes") is unenforced. | Explicit `ColorScheme` interface; `const light: ColorScheme` / `const dark: ColorScheme`. This is the single highest-leverage fix in the repo. |
| **Medium** | `src/theme/ThemeProvider.tsx:3,40,51`; `src/storage/onboardingStorage.ts:1` | AsyncStorage is imported directly in two unrelated modules with no storage abstraction — if the target app standardizes on MMKV or already wraps storage, migration touches every module; the two keys also use inconsistent conventions (`@ari/themePreference` unversioned vs `@ari/onboardingSeenV1` versioned). | Add a tiny `src/storage/kv.ts` (get/set/remove) both modules consume; version both keys. |
| **Medium** | `src/theme/tokens.ts:3–26` | No extension mechanism: the raw palette isn't exported and `ThemeProvider` accepts no token overrides, so re-branding (README's own step 6) means editing scaffold internals — every future scaffold update becomes a manual merge in the host app. | Accept an optional `tokens`/`colors` override prop on `ThemeProvider`, or export a `createTheme(overrides)` factory. |
| **Low** | `src/theme/useTheme.ts:1–2` | `useTheme` lives in `ThemeProvider.tsx` and is re-exported from `useTheme.ts`, creating two canonical import paths for the same hook (both used inside the repo itself — screens import from `../../theme/ThemeProvider`). | Pick one public entry point (a `theme/index.ts` barrel) and use it consistently. |
| **Low** | `src/theme/tokens.ts:112–119` | `typography` tokens omit `fontFamily`/`letterSpacing`, so type renders differently on iOS vs Android and there's no slot for the brand font when it lands. | Add `fontFamily` (even as a platform default constant) to the token shape now, before call sites proliferate. |

Positives: semantic role naming (`bg/text/border/accent/status` × `primary/secondary/tertiary`) maps cleanly to the README's migration table; context value is memoized on `[mode, preference]` so consumer re-renders are correctly bounded; `useTheme` throws outside the provider (fail-fast); `setApiClient()` injection in `account.ts` is a clean integration seam; onboarding screens consume tokens exclusively. Integration risk is moderate and mostly documented, but nothing pins peer-dep versions.

## 5. UI/UX audit — Grade: C+

*Excellent light-mode text ramp and coherent spacing/type scales, but four computed contrast failures — including the primary CTA in dark mode — and missing screen-reader plumbing.*

Computed WCAG ratios (from actual hex values):

| Sev | Location | Issue (measured) | Recommendation |
|---|---|---|---|
| **Critical** | `src/screens/Settings/DeleteAccountScreen.tsx:138–142,150` | Disabled delete CTA renders white `text.onAccent` on `border.subtle` `#E2E8F0` — **1.23:1**; the button label is effectively invisible in the default (disarmed) state of a destructive flow. | Use `text.tertiary` on `bg.tertiary` for the disabled state (≈4.4:1) or apply opacity to a colored button. |
| **High** | `src/theme/tokens.ts:72,80` (+ `OnboardingScreen.tsx:113,118`) | Dark mode primary CTA: white `onAccent` on `brand400` `#10B981` — **2.54:1**, failing AA even for large text, on the app's most important button. | In dark mode set `text.onAccent` to `slate900` (`#0F172A` on `#10B981` ≈ 7:1). |
| **High** | `src/components/OfflineBanner.tsx:54,60–63` | White text on `status.warning` `#F59E0B` — **2.15:1** (the 0.9-opacity caption is worse), on a banner whose entire job is to be read. | Dark text (`slate900`) on amber, or a darker amber background. |
| **Medium** | `src/screens/Settings/DeleteAccountScreen.tsx:141` | Enabled delete CTA: white on `danger` `#EF4444` — **3.76:1** at 16px/600 (not WCAG "large text", needs 4.5:1). | Darken the danger fill to `#DC2626`/`#B91C1C` (the pressed color already measures 6.47:1). |
| **Medium** | `src/screens/Onboarding/OnboardingScreen.tsx:61,124`, `src/screens/Settings/DeleteAccountScreen.tsx:156` | "Skip", "I already have an account", and "Cancel" `Pressable`s lack `accessibilityRole="button"` (the main CTAs have it), so screen readers announce them as plain text. | Add `accessibilityRole="button"` to every pressable. |
| **Medium** | `src/screens/Settings/DeleteAccountScreen.tsx:110–126` | The error box appears with no `accessibilityLiveRegion`/alert role, so screen-reader users are never told the deletion failed. | Add `accessibilityRole="alert"` / `accessibilityLiveRegion="polite"` (as `OfflineBanner.tsx:49–50` already correctly does). |
| **Medium** | `src/screens/Onboarding/OnboardingScreen.tsx:83–97` | Progress dots are the only step indicator and are purely visual (no label, and inactive dots measure **1.48:1**, under the 3:1 non-text minimum); paging changes are never announced. | Add `accessibilityLabel={"Step " + (index+1) + " of " + slides.length}` on the dots container and darken inactive dots to `border.strong`. |
| **Low** | `src/theme/tokens.ts:82` + `src/screens/Onboarding/Slide.tsx:15` | Dark-mode `accent.subtle` is `slate800` on a `slate900` background — **1.22:1**; the hero card all but disappears in dark mode (and loses its brand tint entirely). | Use a low-alpha emerald (`rgba(16,185,129,0.12)`) for dark `accent.subtle`. |
| **Low** | `src/theme/tokens.ts:53` | `status.success` `#10B981` measures **2.54:1** on white — a token trap for anyone using it as light-mode text. | Provide a text-safe success (`#047857`) or document status tokens as fill-only. |
| **Low** | `src/components/OfflineBanner.tsx:60,79`, `src/screens/Settings/DeleteAccountScreen.tsx:140` | The repo fails its own audit: `bash scripts/find-hardcoded-colors.sh ./src` flags 4 hardcoded literals (`#FFFFFF` ×2, `#000`, `#B91C1C`) in the very scaffold that preaches token migration. | Tokenize them (`text.onAccent`, a `status.dangerPressed`/`overlay` token). |
| **Low** | `src/screens/Settings/DeleteAccountScreen.tsx:50` | No `KeyboardAvoidingView`, so the confirm input and CTA can be covered by the keyboard on smaller devices. | Wrap the ScrollView in `KeyboardAvoidingView` (iOS `padding` behavior). |

Positives (measured): light text ramp is exemplary — 17.85 / 7.58 / 4.76:1, all AA including tertiary/placeholder; light CTA 5.48:1 and pressed 7.68:1; dark text ramp 17.06 / 12.02 / 6.96:1; eyebrow accent 5.48:1 (light) and 7.04:1 (dark). Typography (32/24/16/13) and 4-based spacing (4–48) are coherent scales. Touch targets: primary CTAs ≈52px, smaller pressables compensated with `hitSlop={12}` — acceptable. Dark mode token coverage is structurally complete (every semantic slot has a dark value); the failures are value choices, not gaps.
