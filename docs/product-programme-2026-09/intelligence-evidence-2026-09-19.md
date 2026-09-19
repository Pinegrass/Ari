# Source-backed reviews and monthly pattern confirmation

Local implementation; no deployment, device verification or provider calls.

## Implemented

- Periodic report observations now carry deterministic evidence IDs and source-group references. The same query results feed both arithmetic and provenance; rows are scoped to the authenticated owner. The revision includes source amounts, categories, dates, edit timestamps and profile currency, and changes after edits/deletions. Language does not change evidence identity.
- Source entries expose existing transaction correction routes. Mobile navigates to the exact existing editor while preserving description/note/recurrence data. Web allows amount/date correction using the original `updatedAt` concurrency token. Failed edits retain drafts; conflicts require refresh.
- Current reviews show only a fresh, complete, ledger-consistent confirmed planning snapshot, with confirmation/expiry timestamps. Historical reviews do not present today's plan as past knowledge. Stale/missing/changed plans expose no payday or obligations. These are user-confirmed inputs, not bank-verified balances.
- `GET /api/reports/recurring-candidates` offers conservative monthly expense/payday suggestions from the preceding 120 days: at least three named matching observations, 25–35-day gaps, amounts within ten percent. It abstains on duplicate-day/irregular/short histories, overdue next dates, savings, transfer-tagged entries, and existing recurring templates/instances.
- Suggestions remain predictions until an explicit confirmation updates the latest source transaction with `isRecurring=true`, `recurrenceRule=monthly` and its original edit timestamp. The transaction endpoint now requires a boolean flag. This enables the existing recurrence workflow; it does not create a confirmed balance or safe-to-spend plan. Both clients describe this effect before confirmation.
- English/Hindi source review, correction, loading/error/empty, confirmation and retry states are supplied. Private mode hides the mobile intelligence panel. Source entry lists initially render twenty rows per period with a show-more control.

## Validation

- Backend focused report/intelligence/grounding suite: **32 passed**. Ownership, source edit/deletion invalidation, language-stable IDs, comparison scope, planning freshness/historical withholding, explicit recurrence confirmation, strict boolean input and conservative abstention covered.
- Mobile intelligence component: **3 passed**. Exact editor payload, explicit confirmation, failed-save recovery, Hindi loading/error/empty verified with mocked transport.
- Mobile standalone TypeScript and scoped lint passed before final root integration; root records final complete suite results.
- Web API/copy regression tests added; web verification agent records final whole-suite/build results.

## Remaining boundaries

- The transaction schema has no per-entry currency. Responses state current-profile-currency basis and unavailable per-entry currency; no FX conversion or historical currency certainty is claimed.
- The recurrence detector is deliberately monthly-only and requires explicit identity from merchant/income source/description. It is not a comprehensive subscription/income detector.
- History baselines use three completed calendar months before the reviewed period. Monthly spending median requires at least three expense dates per month; category medians require observations in all three months. Missing income months remain unknown; three recorded monthly totals are labeled similar only when maximum is within 20% of minimum. These thresholds indicate recorded-history sufficiency, never complete financial coverage.
- Fixed Tomo prompt interpolation that previously left a literal `{context}` placeholder. Actual owner-scoped context now excludes future entries, labels recorded net flow correctly, and returns ledger source metadata with `claimVerification: not_verified`. AI prose uses human-readable attribution, never machine citation hashes. Both clients offer current entry inspection and explain that AI interpretation can be wrong. The response metadata is provenance of supplied context, not proof that every generated claim is supported.
- Source correction UI, native rendering, recurring generation and provider/live round trips still require acceptance; automated fixtures do not replace them.

Mobile source editing first reconciles the authenticated ledger and opens the actual local row; missing rows report failure instead of silently succeeding. Recurrence confirmation refreshes local transaction state before the report, preserving pending rows through the existing reconciliation mechanism.
