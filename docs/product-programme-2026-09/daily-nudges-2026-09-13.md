# Shared nudges and three daily opportunities — 13 September 2026

Owner requested the shared priority/retention implementation and daily nudges three times a day. No reply to the optional timing question was received during implementation; the stated assumption is 9 AM, 2 PM and 7 PM in notification-preference timezone, skipping slots without an eligible action. This is an implementation checkpoint, not live activation.

## Behavior

- Home and the new worker share one selector: confirmed planning obligations due within two days (only while the plan is ready), planning requiring reconfirmation, latest unread weekly/monthly review, then existing budget/activation guidance.
- Confirmed obligations come from saved planning inputs. Device-only bill records are not available to this backend selector. The worker does not infer payment certainty or use predicted income.
- Home opens planning, the anchored review, budgets or capture directly. Daily review push payloads retain the safe period/date route; no amount, merchant or generated explanation goes to the provider.
- Three local-hour windows:09:00–09:59,14:00–14:59,19:00–19:59. Existing quarter-hour scheduler tick checks eligibility, so delivery can occur after the nominal hour. No catch-up burst after missed windows. Preferences/quiet hours can suppress windows.
- At most one attempt per user/window, at most three server pushes per local calendar day and default21 per rolling seven days. Existing saved lower weekly limits are preserved. Both clients accept/display limits0–21. Local OS bill/check-in reminders remain separately controlled and are not counted in this server budget.
- The same candidate is not resent within the local day; a later slot can select another eligible candidate. An unresolved candidate may be eligible on a later day. No promise that every user receives exactly three pushes.
- User row lock covers fresh candidate/policy checks and reservation. The existing event uniqueness prevents duplicate candidate sends. A retained nonfinancial slot marker prevents repeated scheduler invocations from selecting a second action in the same window. Failed or unknown attempts consume the slot; unknown provider outcomes are never blindly retried.
- Home dismissal now needs server acknowledgement, stores a hashed24-hour suppression marker, and then refreshes the next eligible action. Failed requests keep the card and show retry copy. No offline delivery guarantee is claimed.
- Worker pages50 eligible accounts, stops starting account work after8seconds, and returns an ID cursor; runner follows remaining pages. Provider timeout remains15seconds. This is bounded per-request work, not a production load benchmark.

## Release controls and contracts

New endpoint POST `/api/coaching/daily-nudges/run` requires the existing scheduler token and backend `DAILY_NUDGES_ENABLED=true`. Scheduled workflow additionally requires the same-named repository variable. Both remain OFF/unset in live configuration; no workflow was pushed or enabled. No new migration: existing JSON preferences and NudgeDelivery ledger are reused. The prior outbox gate remains unchanged.

Deploy coordinated backend plus client preference/routing changes only after release authorization. The new dismissal endpoint must be available before new mobile dismissal is released; older backend returns a visible failure rather than falsely confirming suppression. Existing old mobile versions can still use nonempty actionPrompt fallbacks. Web changes are the weekly-limit contract and explanatory copy; its broader redesign remains unpublished.

## Verification and limits

Backend full suite:309passing, including8new daily-nudge tests. Covered three distinct sends/window reruns, unknown outcomes, local timezone/quiet hours, existing lower cap, no candidate/outside-window skips, priority and due-obligation selection, cross-user dismissal isolation, suppression,21/22 validation and disabled/internal auth. Provider calls are mocked; SQLite does not prove real PostgreSQL concurrent-worker locking. Existing PostgreSQL quota test fixture explicitly retains maxPerWeek1 after the new default.

Mobile full-suite and final focused results, web build and exact commit IDs are appended below when complete. No remote database change, deployment, OTA, real push, device interaction or new production analytics collection occurred. Real device display/receipt verification, concurrent PostgreSQL daily-worker acceptance and operational throughput remain release checks. Daily sends must not be described as live.

Final local commits: mobile `d0093c5`, backend `b855630`, web `7a1533f`. Final mobile full suite52suites/556tests passes; backend309tests and scoped Ruff F/E9 pass; web12tests, TypeScript, scoped lint and production build pass. Mobile TypeScript passes; scoped lint has0errors and two pre-existing duplicate gesture-handler import warnings in App.tsx. An initial asynchronous test warning was corrected with awaited act; final full suite passed without that warning. Diff whitespace checks pass.

No fresh browser/native/delivery acceptance was performed for this change. The earlier calm Home preview remains historical evidence. All three commits are local/unpublished. No source push or live scheduler activation.
