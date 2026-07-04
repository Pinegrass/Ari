# Accessibility Audit — v1.1.0 (2026-07)

**Task:** Sprint 4 / C2. **Standard:** WCAG 2.1 AA for text contrast; Android
TalkBack + OS font scaling as the assistive-tech targets. This pass prioritised
the **money paths** (add / edit / delete / view spend) — the flows a user cannot
avoid — with the rest tracked as a backlog below.

## What changed this pass

| Area | Fix |
|------|-----|
| `BalanceCard` hero amount | `numberOfLines={1} adjustsFontSizeToFit` so the ₹ hero number shrinks-to-fit at OS font scale 1.3× instead of clipping/wrapping; wrapped label+amount as one `accessible` summary for TalkBack. |
| `BalanceCard` money pills | `flex:1` per pill + `adjustsFontSizeToFit`; each pill is an `accessible` node labelled e.g. "Money out ₹33,800" (was three unlabelled Text nodes read as fragments). |
| `TransactionItem` row | Added `accessibilityRole` + a composed `accessibilityLabel` ("Groceries, food, minus ₹450, 4 Jul") and an `accessibilityHint` for the long-press-to-edit gesture (previously invisible to TalkBack). |
| `TransactionsScreen` filters | `accessibilityRole="tab"` + `accessibilityState={{selected}}` so the active All/Expenses/Income filter is announced as selected. |
| `AnimatedFAB` | Verified already compliant: 56×56 target, labelled "Add new transaction", `button` role. |

## Contrast (WCAG AA)

**Light palette (shipping):** the forest-on-cream system was already audited in
Sprint 2. Body pairs pass AA: `ink #23291F` on `card #FBF8F0` ≈ 12.6:1;
`inkSoft #6E6B5C` on `cream #F4EFE3` ≈ 4.9:1. `inkFaint #9A9683` is decoration
only (documented in `tokens.ts`) — never used for reading text.

**Dark palette (draft, pending sign-off):** contrast computed live in the
sign-off preview (`docs` → dark-palette artifact). Summary:
- `ink #EAF3EC` on `card #182420` — passes AA (body).
- `inkSoft #A6B8AC` on `card` — passes AA (body).
- ⚠️ **`ink` on `forest #3E7A54`** (light text on the primary button) is the
  tightest pair — verify it clears 4.5:1 on the preview before flipping the gate;
  if it lands ~4:1, brighten `forest` a touch (candidate `#47895F`). Flagged for
  founder palette sign-off (C4).

## Font scaling (OS 1.3×)

- Money hero + pills: fixed (above).
- Remaining: audit `AddTransactionScreen` keypad amount (60px) and P&L /
  Trends summary numbers at 1.3× on the device build — they use large type in
  fixed rows and are the next most likely to clip. Listed in the backlog.

## Hit targets (≥44pt)

- FAB (56) OK. `TransactionItem` delete: **fixed** this pass — `hitSlop` 8→14
  (16px icon + 14 all sides = 44px effective). Search-clear "x" and filter chips
  are OK (chips are full-height).
- Backlog: sweep all 16–18px icon-only buttons (modal close "x", category
  picker chips) and ensure a 44pt effective touch area via `hitSlop` or padding.

## TalkBack smoke checklist (device-gated — run on the preview APK, Task 9)

- [ ] Dashboard: swipe through hero → "Spent today, ₹X" read as one unit; pills
      read as "Money out ₹X", etc.
- [ ] Add expense: keypad digits, category chips, and **Save** are all reachable
      and announced; Save announces success.
- [ ] Edit: long-press a transaction row → hint announced → edit sheet reachable.
- [ ] Delete: delete control announced as a button; confirm sheet reachable.
- [ ] Transactions: filter tabs announce selected state; list rows announce the
      full "desc, category, amount, date" label.
- [ ] Bill reminder + widget deep links land on a screen that TalkBack can read
      from the top.

## Backlog (prioritised, post-v1.1.0 unless quick)

1. Icon-only buttons across modals (close "x", steppers) — add labels + 44pt.
3. Font-scale sweep of keypad amount + report numbers at 1.3×.
4. `accessibilityState` on all toggle/segment controls (TypeToggle, period
   selector, category picker).
5. Focus order review on the bottom-sheet modals (add/edit).
