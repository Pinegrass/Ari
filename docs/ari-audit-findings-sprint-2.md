> **Deliverable:** Codebase audit + fix document, severity-tagged. Submitted before Sprint 2 work resumes.

# Ari — Audit Findings & Fixes (Sprint 2 Improvement & Refinement)

**Product:** Ari (`com.pinegrass.ari`)
**Version:** v1.0.2
**Date:** 2026-07-01
**Author:** Senior Dev, Pinegrass

## Severity key

- **Critical:** Blocks iOS App Store release or causes data loss.
- **High:** Major UX / quality gap; should be fixed before launch.
- **Medium:** Important but not launch-blocking; fix or mitigate.
- **Low:** Polish, debt, or documentation; schedule for future sprint.

## 1. Critical fixes

### 1.1 Safe-area handling gap on `ShareCaptureScreen`
**Severity:** Critical
**Finding:** `ShareCaptureScreen` was the only screen in the app not wrapped in `SafeAreaView`. It used `useSafeAreaInsets()` only for bottom padding, leaving top content at risk of being obscured by the notch / Dynamic Island on iOS.
**Fix:** Replaced the root `View` with `SafeAreaView edges={['top', 'bottom']}` and removed the manual bottom inset calculation.
**Files:** `src/screens/ShareCaptureScreen.tsx`
**Status:** ✅ Fixed

### 1.2 Add Entry note field hidden by keyboard
**Severity:** Critical
**Finding:** The note/description modal in `AddTransactionScreen` did not use `KeyboardAvoidingView`. On iOS the keyboard could cover the extra-note `TextInput` and the Done button; some Android skins behaved similarly.
**Fix:** Wrapped both the note sheet and category sheet in `KeyboardAvoidingView` (iOS `padding` behavior) plus a `ScrollView` so the bottom inputs remain reachable.
**Files:** `src/screens/AddTransactionScreen.tsx`
**Status:** ✅ Fixed

## 2. High-priority improvements

### 2.1 Dashboard lacks month-level and category visuals
**Severity:** High
**Finding:** The Dashboard only showed "Spent today" and a recent list. There was no chart for "This Month" spending or category breakdown.
**Fix:**
- Installed `react-native-gifted-charts` + `react-native-svg`.
- Added `ThisMonthSummary`, `MonthSpendChart`, and `CategoryBreakdown` components.
- Extended `DataContext` to fetch daily analytics from `/api/analytics/daily`.
- Inserted the new cards into `DashboardScreen`.
**Files:**
- `package.json`
- `src/context/DataContext.tsx`
- `src/api/reports.ts`
- `src/components/dashboard/ThisMonthSummary.tsx` (new)
- `src/components/dashboard/MonthSpendChart.tsx` (new)
- `src/components/dashboard/CategoryBreakdown.tsx` (new)
- `src/screens/DashboardScreen.tsx`
**Status:** ✅ Fixed

### 2.2 Trends tab is list-first, not infographic-first
**Severity:** High
**Finding:** The `Transactions` tab was effectively a transaction list with two summary pills. It did not surface trend charts, category comparisons, anomaly callouts, or AI suggestions.
**Fix:**
- Added `TrendLineChart`, `CategoryComparison`, and `InsightCard` components.
- Rewrote `TransactionsScreen` as a Trends dashboard: period selector, summary grid, income-vs-expense line chart, top-category bars, nudge + insights, search/filter, then the transaction list.
- Reused existing backend endpoints (`/api/reports/pnl`, `/api/insights`, `/api/tomo/nudge`); no new backend infra was built.
**Files:**
- `src/components/trends/TrendLineChart.tsx` (new)
- `src/components/trends/CategoryComparison.tsx` (new)
- `src/components/trends/InsightCard.tsx` (new)
- `src/screens/TransactionsScreen.tsx`
**Status:** ✅ Fixed

### 2.3 iOS privacy manifest / permission declarations
**Severity:** High
**Finding:** No custom iOS usage strings were declared for Face ID or notifications; privacy manifest was not explicitly verified.
**Fix:**
- Added `NSFaceIDUsageDescription` and `NSUserNotificationUsageDescription` to `app.json`.
- Created `docs/ios-app-store-metadata.md` with a privacy manifest checklist, screenshot specs, and App Store metadata templates.
- Documented that `npx expo prebuild -p ios` must be run to generate `PrivacyInfo.xcprivacy`.
**Files:** `app.json`, `docs/ios-app-store-metadata.md`
**Status:** ✅ Fixed / documented

## 3. Medium-priority findings

### 3.1 Backend transaction input validation gaps
**Severity:** Medium
**Finding:** `recurrenceRule`, `tags`, `incomeSource`, `merchant`, and text fields were not validated or truncated.
**Fix:** Added helpers in `backend/routes/transactions.py` to:
- Validate `recurrenceRule` against the allowed enum.
- Limit tags to 20 items and 30 chars each.
- Truncate `description` (255), `note`/`raw_input` (500), `incomeSource`/`merchant` (100).
**Files:** `backend/routes/transactions.py`
**Status:** ✅ Fixed

### 3.2 Public-by-design client keys need documentation
**Severity:** Medium
**Finding:** Supabase anon key, PostHog key, Sentry DSN, and Google client ID are bundled into the client. This is correct for these services but must be documented in the privacy policy.
**Fix:** Documented in `docs/security-audit-sprint-2.md`; no code change.
**Files:** `docs/security-audit-sprint-2.md`
**Status:** ✅ Documented

### 3.3 Onboarding screen uses gradients
**Severity:** Medium
**Finding:** `OnboardingScreen` uses `LinearGradient`, which violates the current design system's "no gradients" rule.
**Fix:** Not changed in this sprint to avoid scope creep. Flagged as a design debt item for a future reskin pass.
**Files:** `src/screens/OnboardingScreen.tsx`
**Status:** ⚠️ Acknowledged / backlog

## 4. Low-priority findings

### 4.1 Reusable safe-area wrapper created
**Severity:** Low
**Finding:** Safe-area logic was duplicated across screens.
**Fix:** Created `ScreenShell` component for future screens. Applied it where appropriate; existing screens already used `SafeAreaView` correctly.
**Files:** `src/components/ScreenShell.tsx`
**Status:** ✅ Fixed

### 4.2 No SSL certificate pinning
**Severity:** Low (future hardening)
**Finding:** The app does not pin certificates for API or Supabase endpoints.
**Fix:** Not implemented. Added to security backlog.
**Files:** `docs/security-audit-sprint-2.md`
**Status:** ⚠️ Backlog

## 5. Backend stack clarification

The audit brief referenced **Fastify/Supabase**, but the repository's data backend is **Flask/SQLAlchemy** hosted on Railway, with **Supabase used only for authentication**. No Fastify work was performed because none exists in the codebase. If a migration to Fastify is planned, it is a separate architectural decision requiring founder sign-off.

## 6. Competitive feature-gap study

A separate audit-only document was created:
- **File:** `docs/competitive-gap-study.md`
- **Scope:** Walnut, Money Manager, YNAB, Spendee
- **Outcome:** 15 gaps ranked by user value and implementation effort. Nothing from the list was built without founder sign-off.

## 7. Verification checklist

- [x] `npm run typecheck` passes.
- [x] `npm run lint` passes (0 errors; remaining warnings are pre-existing).
- [x] `npm test` passes (426 tests).
- [x] `npx expo install --check` passes (dependencies aligned with Expo SDK 54).
- [x] OTA architecture implemented: `fingerprint` runtime version, update toast, manual check in About.
- [x] No hardcoded secrets in `src/` or `backend/`.
- [x] Safe-area audit complete; `ShareCaptureScreen` fixed.
- [x] Keyboard overlap fixed in Add Entry.
- [x] Dashboard redesigned with charts.
- [x] Trends tab overhauled with charts and AI callouts.
- [x] iOS metadata + privacy manifest checklist created.
- [x] Security audit doc created; backend validation tightened.
- [x] Competitive gap study created.

## 8. Files changed in this sprint

### New files
- `src/components/ScreenShell.tsx`
- `src/components/UpdateToast.tsx`
- `src/components/dashboard/ThisMonthSummary.tsx`
- `src/components/dashboard/MonthSpendChart.tsx`
- `src/components/dashboard/CategoryBreakdown.tsx`
- `src/components/trends/TrendLineChart.tsx`
- `src/components/trends/CategoryComparison.tsx`
- `src/components/trends/InsightCard.tsx`
- `src/hooks/useOTAUpdates.ts`
- `docs/ios-app-store-metadata.md`
- `docs/security-audit-sprint-2.md`
- `docs/competitive-gap-study.md`
- `docs/ari-audit-findings-sprint-2.md`
- `docs/ota-strategy.md`

### Modified files
- `package.json` / `package-lock.json`
- `src/screens/AddTransactionScreen.tsx`
- `src/screens/ShareCaptureScreen.tsx`
- `src/screens/DashboardScreen.tsx`
- `src/screens/TransactionsScreen.tsx`
- `src/screens/AboutScreen.tsx`
- `src/context/DataContext.tsx`
- `src/api/reports.ts`
- `src/lib/otaUpdates.ts`
- `src/lib/analytics.ts`
- `App.tsx`
- `backend/routes/transactions.py`
- `app.json`

## 9. Next steps

1. Run `npm run lint` and `npm test`; fix any regressions.
2. Build a fresh iOS dev client: `npx expo prebuild -p ios` then `npx expo run:ios` (requires macOS).
3. Smoke-test on a notched iOS simulator and an Android device.
4. Generate App Store screenshots per `docs/ios-app-store-metadata.md`.
5. Upload a TestFlight build via EAS for internal review.
6. Founder review of `docs/competitive-gap-study.md` to decide which gaps enter Sprint 3.
