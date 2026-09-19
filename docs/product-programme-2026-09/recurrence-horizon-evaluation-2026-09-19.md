# Recurrence and planning horizon — 19 September 2026

Local implementation only; no device/provider testing or release.

## Supported predictions

The deterministic detector now supports the five recurrence rules already implemented by Ari's transaction schema and mobile recurring engine: weekly, every two weeks, monthly, quarterly and yearly. Weekly/biweekly candidates require at least four occurrences; other cadences require at least three. Every consecutive interval must fit its cadence's narrow day range, amounts must remain within ten percent, and same-day duplicates, mixed or unsupported intervals, savings/transfers, existing recurring templates and generated children abstain. The output remains explicitly predicted and unconfirmed.

Next dates use the engine's existing semantics: seven/fourteen days or one/three/twelve calendar months, clipping invalid month-end dates. Only dates strictly after today and at most 45 days ahead are suggested. No automatic confirmation, overdue catch-up, new cadence, bank balance or guaranteed payment was introduced.

The authenticated query uses the account and date predicate supported by canonical `idx_expenses_user_date`, a 1,100-day window and a maximum 2,001-row fetch. More than 2,000 rows returns `history_limit` with no candidates, rather than infer a false pattern from partial history. Both clients explain this abstention. Production query-plan/latency verification remains separate from these bounded local tests.

## Confirmation and compatibility

Mobile and web show the actual localized cadence in the explicit confirmation. Existing clients assume all candidates are monthly, so the API retains monthly-only results unless the caller requests `cadences=all`; upgraded clients advertise that capability. Existing original-entry correction and `updatedAt` conflict protection remain in use. Confirming a recurrence does not manufacture confirmed planning inputs.

## Planning horizon

Fresh planning outlooks expose a horizon from today through the user's confirmed payday, labeled `user_confirmed_inputs`, with `includesPredictions: false` and `bankBalanceProjectionAvailable: false`. Clients explain this distinction. Expired, historical, changed-ledger or otherwise unavailable inputs do not expose a horizon. Reports retain unavailable closing-balance/safe-to-spend fields; no inferred cash projection is presented as bank truth.

## Evaluation

Fixtures exercise all five supported cadences, exact source rows, leap years, February/month-end clipping, insufficient short/annual history, duplicates, mixed schedules, unsupported daily gaps, out-of-horizon dates, bounded-history abstention, old-client compatibility and stale planning withholding. These are deterministic regression fixtures, not calibrated predictive accuracy against a representative real-user dataset.

Focused validation: 23 backend recurrence/provenance tests, five mobile interaction tests and eight web API/localization tests; mobile/web scoped ESLint, backend scoped Ruff, and mobile TypeScript passed. Final integrated client checks are owned by the root orchestration lane. No migration is needed for these recurrence/horizon changes.
