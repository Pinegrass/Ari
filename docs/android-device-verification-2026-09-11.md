# Android device verification — 2026-09-11

**Outcome: release gate FAILED. Existing Play internal draft4 remains unpublished.**

## Device and artifact
Samsung SM_M166P, Android16, serial R9ZY6046FML. Native package com.pinegrass.ari remained 1.3.0/code55, last installed 2026-09-08. It was generated from the exact production AAB recorded in docs/android-release-2026-09-08.md. No new installation, build, OTA publication or rollout was performed.

Mobile HEAD remains 3e00ee520af3801c3b537d85b2ca89cb5fcbee0a. No app code changed. Prior baseline suite results are not substitutes for these device results.

**JavaScript identity limitation:** the Home presentation changed after the offline cold restart (cream hero/engagement panel before; forest hero without that panel afterward), although package version/update time were unchanged. About afterward reported runtime be41337d2d3aac91e491e0fd18bef2ee03397691, production channel, and an update-check failure message. expo-updates is enabled. Exact updateId/embedded status was not obtainable from About or available ExpoUpdates log buffer. Do not claim all observations exercised one pinned JavaScript bundle; OTA/fallback is a hypothesis, not a proven cause.

## Reproduced defects
1. **High: Home is stale relative to server-backed Smart Ledger.** Home began with zero today and recent records from July, while Smart Ledger displayed existing September records including two dated today. Restart did not make Home current. Source: DataContext.fetchTransactions only fetches server history when localStore.isSeeded() is false (src/context/DataContext.tsx around205); subsequent loads read local data and flush outbound changes. SmartLedgerScreen fetches transactions for its selected month from the API. Incoming reconciliation must preserve pending/failed local rows and deletions; do not simply overwrite the store.
2. **High: income appears in spending categories.** Created marked expense1, then edited the same entry to income10. Home's Spending by category included Salary10 and its total increased by10, while the daily expense total excluded income. Trends Top categories also included Salary. Home passes summary.categories directly to CategoryBreakdown (DashboardScreen around249); fetchSummary loads /transactions/summary. Endpoint/consumer contract needs review in owning repos before choosing the fix.
3. **High: Private Mode leaks daily-spending total.** Enabling Private Mode masked category values and recent transaction amounts/accessibility labels, but MonthSpendChart retained its numeric Total. Source src/components/dashboard/MonthSpendChart.tsx16,82 uses useLocale.formatCurrency instead of privacy formatting. Smart Ledger masked amounts correctly in this check.

These observations are independent of the previously recorded missing live Play-signing association and billing/server configuration gates.

## Exercised checks
- Online cold launch: successful; first measured native launch1043ms, subsequent812ms. These are ActivityManager timings, not end-to-end performance benchmarks.
- Existing signed-in session survived forced stops/restarts; no data clear or reinstall.
- Zero-value entry Save was visibly disabled; positive1 enabled Save.
- Note/description entry accepted unique marker ARI_QA_20260911_DELETE.
- Low-confidence AI category prompt appeared; confirming selected Other, then explicit Save persisted the expense.
- Saved expense appeared on Home and survived forced restart.
- Editing changed amount1 to10, expense to income, and default category to Salary. Home and server-backed Smart Ledger reflected the marked income.
- Delete confirmation named the correct test entry and amount. Cancel preserved it; Confirm deleted it.
- Cleanup verified: marker absent from Home/Trends visible recent list and server-backed September Smart Ledger; ledger count returned13 to12. No other ledger record intentionally changed.
- Accountant navigation, Trends chart/category rendering, Smart Ledger, Budget Planner, Bills, Savings Goals and Settings opened.
- Empty budget amount rejected with “Enter a valid budget amount”; no budget created.
- Empty bill name rejected with “Name required”; acknowledged OK and cancelled form; no bill created.
- Private Mode exercised, defects above observed, then restored to original off state.
- Pro screen safely reported unavailable from Google Play until internal Play installation. No purchase/restore verified and no charge initiated.
- Tomo empty-send disabled. Generic 50/30/20 preset returned live response. Chat initially contained only greeting; cleared the test exchange and verified greeting/presets returned. Provider-side retention/quota effects were not reversed or claimed.
- Offline cold launch with Wi-Fi and mobile data disabled succeeded (native launch1504ms); Home rendered. Offline write/sync not exercised. Both network settings restored to original enabled values1.
- Available crash buffer contained zero “Process: com.pinegrass.ari” crash mentions. No claim about crash-reporting delivery, all historical crashes, ANRs or long-term stability.
- Final phone foreground left on Ari Home.

## Not verified
Fresh email/Google authentication, account-switch isolation, real notification delivery, invite acceptance/Play-signed deep links, Play purchase/restore/backend entitlement reconciliation, offline write/reconnect/conflict handling, other currencies/decimal entry, report period comparisons, export files, recurring generation, font scaling/orientation/accessibility audit and prolonged load. Do not mark these passed. Native sideload cannot establish Play Billing behavior.

## Next work
Resolve the three defects and pin/record JavaScript identity. Rebuild if needed and rerun affected phone flows plus remaining gates. Deploy/recheck the prepared canonical-web Play certificate association through its release workflow. Resume saved Play draft4 only when appropriate; do not duplicate it or promote this failed candidate as verified. Production unchanged.

Private UI files/helper scripts are under D:/Codex/Artifacts/Ari/2026-09-11; they may contain account information and must not be committed or shared. Tooling guarded Ari foreground before inputs and rejected missing/stale UI dumps. Entry-screen blinking prevented reliable uiautomator idle snapshots; fresh screenshots were used there.
