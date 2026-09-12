# Connected Android user-journey walkthrough — 12 September 2026

Completed on Samsung SM_M166P / Android16, serialR9ZY6046FML, approximately14:02–14:11IST after the owner granted exclusive access. This was an agent-operated walkthrough of normal user tasks on the physical phone, not a participant usability study.

## Exact tested client

Native1.3.0/code61 plus downloaded Android update01a0948a-72b6-7334-ae99-f209255c567e, source1c6077d6c6fea304218d7d92505295cee96672f8. About showed the exact update, expected runtimef82b9c561785202f8057920d7a8a052d15c1ed33, internal-release channel and up-to-date status. Latest compatible client was therefore exercised, although no new native binary was built. Live backend remains the prior a4014a8 release; the local84f4df4midnight fix was not deployed or exercised here.

## Pain points, in recommended order

### 1. High — Planning retry discards work

Reproduction: open empty planning, check confirmation, press Confirm and calculate with required fields blank. App shows a general save error. Enter1000in Available cash now, then tap Try again. Cash becomes empty and confirmation resets. The button reloads server inputs rather than retrying/preserving the user's draft.

Impact: a user correcting a mistake loses work and can repeat the same unsuccessful cycle.

Recommendation: separate reload from save retry; preserve dirty drafts on validation/network failure and focus the field requiring correction. Source: src/hooks/usePlanning.ts:16,24; src/screens/PlanningScreen.tsx:35. Evidence: qa-planning-invalid.jsonl, qa-payday-keyboard.png (1000draft), qa-planning-retry.jsonl (blank).

### 2. High — INR entry cannot express paise through the keypad

Observed New entry and Edit entry show digits0–9and delete, with a blank bottom-left key and no decimal point. A user trying to enter125.50has no visible route to that exact amount. Whole-rupee entry worked. Source confirms decimal key is enabled only for locales marked usesDecimalAmounts; this is a locale/product limitation, not an automation tap failure.

Recommendation: support currency minor units for INR as well as other fractional currencies, with a decimal key and consistent display/edit precision. Source: src/screens/AddTransactionScreen.tsx:43,255,499. Evidence: qa-keypad-no-decimal.png.

### 3. Medium — Report drill-down loses the selected period

Daily report for12September correctly showed zero entries after cleanup. Tapping Review entries opened Smart Ledger with older September transactions. It did not restrict the ledger to the day being reviewed. This breaks the connection between a reported number and its underlying entries.

Recommendation: pass report start/end to the ledger and visibly retain the selected period; make clearing that filter explicit. Source: src/screens/PeriodicReportsScreen.tsx:102. Evidence: qa-report-daily.jsonl, qa-report-daily-evidence.jsonl, qa-report-to-ledger.xml.

### 4. Medium — History and deletion are hard to discover

After saving, finding Recent required scrolling below summary/rhythm/chart content. See all transactions opened a page titled Trends, initially displaying charts. Deletion appeared only in its lower transaction list; the Edit entry screen offered no delete action. The eventual confirmation dialog correctly named the QA entry and amount, and deletion succeeded.

Recommendation: provide a clearly labelled Transactions destination that lands on entries; make delete available from entry details/edit with confirmation. Source: src/screens/DashboardScreen.tsx:135,267. Evidence: qa-history-discovery.jsonl, qa-trends-scroll1.jsonl, qa-trends-scroll2.jsonl, qa-delete-locate.jsonl.

### 5. Medium — Planning dates and validation demand avoidable effort

Tapping Next payday opens a full alphabetic keyboard and requires YYYY-MM-DD. Blank required fields can be submitted after checking the confirmation box; feedback is a general 'Check amounts and dates' message below the long form, with no field-specific highlighting. The user must scroll to notice it and infer the correction.

Recommendation: native date picker, required-field checks before submission, inline errors and automatic focus/scroll to the first invalid input. Source: src/screens/PlanningScreen.tsx:28,35. Evidence: qa-payday-keyboard.png, qa-planning-generic-error.png.

## What worked

- Cold launch and existing signed-in session; Home/More and exact update identity.
- Created clearly labelled AriQA12Sep expense1, edited it to2, observed the updated row, then deleted it through explicit confirmation.
- Home reflected the saved amount; final Home returned to0spent today and38entries, matching the pre-test baseline. Daily server-backed report returned0entries after deletion.
- Weekly and daily reports loaded; empty-day copy correctly distinguished no recorded entries from actual finances.
- Invalid planning was rejected; no planning snapshot was saved. The temporary cash draft was cleared by the reproduced retry behaviour.

## Scope and cleanup

Ari was left on Home. No original ledger entry was edited/deleted; one existing entry was opened during navigation and closed without saving. Only the uniquely labelled QA entry was created/edited/deleted. No owner trial, consent or notification preference changed. No chat messages, voice capture, real payment, push-delivery or offline-network tests were performed in this walkthrough. Those are not claimed as verified.

Earlier interference from another app was resolved before this run and is not counted as an Ari defect. UIAutomator sometimes could not reach idle because of the amount caret animation; screenshot-based guarded taps were used, and helper latency is not reported as app latency.

Private artifacts remain D:/Codex/Artifacts/Ari/2026-09-11; financial screenshots and UI dumps are not committed. No application fixes or production deployment made during this assessment. Internal update publication was recorded in the preceding handoff.
