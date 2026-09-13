# Samsung regression verification — 13 September 2026

Owner replied ready. Physically exercised Samsung R9ZY6046FML / SM_M166P, Android16, native1.3.0/code61. About verified downloaded update01a09995-993e-741b-9fff-f2e8c017a182, runtimef82b9c561785202f8057920d7a8a052d15c1ed33, internal-release, up-to-date. Source5ba6d31614ee6ee93fa03cd3461ad210af181e2f. Backendc05a77f previously deployed and verified.

## Targeted results

1. Planning retries: entered synthetic cash1000/reserve0/payday25September. Temporarily disabled Wi-Fi/mobile data, attempted confirmed save, observed request error with full draft retained. Both networks restored in finally. Try again succeeded with remainder1000 and83.33perday. Deleted planning inputs and reopened to confirm missing/blank state.
2. Paise: entered125.50 through INR keypad, including visible trailing zero; saved AriQA13Sep, edited to125.55, reopened with exact amount.
3. History/deletion: Home Transactions shortcut opens directly on entries with Show trends collapsed. Test entry's Edit exposes Delete; confirmation shown; confirmed deletion succeeded.
4. Report date filtering: daily13September report showed0entries after deletion. Review entries opened range2026-09-13–2026-09-13 with0transactions. Clear date filter restored September monthly history.
5. Planning input: confirmed blank submission shows inline amount/payday errors. Native calendar opens, dates through today disabled,25September selectable and retained.

## Cleanup and limits

Initial cache showed38entries; refreshed baseline BEFORE test creation was39entries (an existing12September entry had synced). Final Home39entries,0spenttoday; daily report0entries. Test entry deleted through UI, test planning snapshot deleted and blank on reopen. Both Wi-Fi/mobile-data settings restored to1. Ari left Home. No existing ledger item edited/deleted; no trial, account settings, consent, notification preference or payment changed.

This is an agent-operated regression walkthrough, not a participant study. UIAutomator caret idle delays are tooling overhead. No new source changes/publication this turn. Payment, push receipt, iOS and full Hindi checks remain outside scope.

## Additional finding — open

Smart Ledger's net summary omits the negative sign when expenses exceed income. Observed after clearing the date filter: income0 and positive expenses, but net displayed as unsigned currency. Source src/screens/accountant/SmartLedgerScreen.tsx:342 passes stats.net to magnitude formatter formatAmount. This predates the date-filter fix; record as P2 display correctness issue for a follow-up. Reports retain their signed net correctly. No fix made in this verification turn.

Private evidence files under D:/Codex/Artifacts/Ari: qa13-identity.xml, qa13-history.xml, qa13-paise.png, qa13-created.xml, qa13-edited.xml, qa13-delete-confirm.png, qa13-validation.xml, qa13-calendar.xml, qa13-offline-draft.xml, qa13-retry-success.xml, qa13-report-zero.xml, qa13-filtered-ledger.xml, qa13-cleared-filter.xml, qa13-final-home.xml, qa13-planning-clean.xml. Do not commit financial screenshots or raw UI dumps.
