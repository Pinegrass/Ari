# Android walkthrough fixes — 12 September 2026

All five findings in `device-user-journey-2026-09-12.md` are implemented locally.

| Finding | Implemented behavior |
| --- | --- |
| Planning retry discards draft | Load, save and delete retries are separate. Failed saves retry current inputs. Reloads preserve edited fields and withhold estimates belonging to old inputs. Currency changes discard incompatible drafts. Mobile and web hooks updated. |
| INR entry cannot contain paise | Decimal keypad supports INR, including amounts below one rupee. Entry display keeps the decimal separator and trailing zero during typing; AI parsing preserves two decimal places. Mobile and web display paise; backend accepts two decimals on create and update. |
| Report review loses period | Review passes exact inclusive start/end dates. Ledger loads every intersecting month and filters boundary days. Active range is visible and has an explicit clear action. Fetch errors show retry instead of a misleading empty ledger; stale responses are ignored. |
| History and deletion hard to find | Home has a Transactions shortcut. Transactions opens on the list with trends collapsed behind Show trends. Ordinary Edit exposes Delete with the existing confirmation sheet; errors keep the entry open. Recurring template management remains on its dedicated screen. |
| Planning dates/validation unclear | Native date selection replaces date typing. Local amount, payday, obligation and confirmation checks block invalid saves, show English/Hindi field errors and scroll to the first issue. Payday picker bounds selection to tomorrow through 90 days. |

## Exact source commits

- Mobile: `5ba6d31614ee6ee93fa03cd3461ad210af181e2f`
- Backend: `c05a77ffa07b3ccd6a1edde49b0678ec0f52000d`
- Web: `c10caca1b381d3d2cd351554f165b404c53f9242`

## Verification

- Mobile: 50 suites, 534 tests pass; TypeScript and changed-source ESLint pass. Planning screen tests rerun after final date-picker bounds: 3 pass.
- Backend: 301 tests pass using isolated SQLite. New API regression covers INR paise create/edit/list/summary; excess precision remains rejected.
- Web: 4 suites, 12 tests pass; TypeScript, changed-source ESLint and production build pass.
- Regression coverage includes current-draft save retry, draft retention across reloads, stale estimate suppression, missing/invalid dates and amounts, cross-year report filtering, exact navigation range, INR keypad save and delete success/failure.
- Git whitespace checks pass. No device tests in this implementation turn. Automated component tests do not verify native picker presentation, physical touch ergonomics or screen-reader speech.

## Release dependency and unchanged external gates

Nothing pushed, deployed, installed or published in this turn. Deploy backend `c05a77f` before publishing the mobile paise change: the currently live backend still rejects fractional INR. Web changes are also local only. No auth, billing or entitlement contracts changed.

Samsung still has the previously verified internal update `01a0948a-72b6-7334-ae99-f209255c567e` (source `1c6077d`), not these fixes. BillDesk verification, Google Play submission permission/catalog, paid purchase/restore, actual push receipts, full native Hindi review and deferred iOS verification remain external gaps.
