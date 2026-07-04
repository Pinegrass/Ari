# Maestro E2E Flows

End-to-end flows for Ari, run with [Maestro](https://maestro.mobile.dev/) against
a debug build on an emulator or device.

```bash
npm run e2e                       # runs every flow in .maestro/
maestro test .maestro/login_flow.yaml   # a single flow
```

## ⚠️ Status: refreshed for v1.1.0, NOT yet verified green

These flows were **rewritten against v1.1.0 source on 2026-07-05** — the Sprint 2
reskin had rotted every selector (old tab labels `Expenses`/`Budget`/`Settings`,
the removed one-tap demo login, `Add Expense`/`Save Transaction` copy). The
selectors below are correct **by construction** from the current screens, but per
the Sprint 4 rule — *a flow that never ran green is worse than no flow* — they are
**not trusted until they pass on an emulator**. That first green run is the gate
before wiring any of this into CI.

**Before relying on these:** boot an Android emulator, install the v1.1.0 debug
build, and run `npm run e2e`. Fix any selector the run flags, commit the
confirmed-green set, then wire CI.

## What changed (v1.0.1 → v1.1.0 UI)

| Old selector | New |
|--------------|-----|
| tabs `Expenses` / `Budget` / `Settings` | `Trends` / (Budget moved off-tab) / `More` |
| one-tap "🎮 Try with demo account" | email `you@example.com` + password `Your password` |
| `Add Expense` CTA | `Add an entry` |
| amount text field | in-app numeric keypad (tap digit keys) |
| `Save Transaction` / `Saved!` | `Save entry` / `Update entry` |

## Flows

| Flow | Covers | Confidence |
|------|--------|-----------|
| `login_flow.yaml` | splash → email/password demo login → Home | high (selectors verified in source) |
| `add_transaction_flow.yaml` | add via keypad → save → long-press edit → update | med — long-press edit target + on-save destination need emulator confirmation |
| `navigation_flow.yaml` | Home / Trends / Tomo / More tab smoke | high |
| `tomo_chat_flow.yaml` | quick-prompt send + reply render | med — reply timing |
| `export_flow.yaml` | More → Export Data | high |

## Deferred until after the first green run (write once, verified)

Per the never-ran-green rule, these were **not** written blind:

- **Budget create** — Budget is no longer a tab and its current entry point
  isn't discoverable from source; confirm the nav path on-device first.
- **Bill create → notification assert** — needs the reminder permission +
  scheduled-notification assertion validated on a device.
- **Offline add → airplane-mode → sync verify** — needs device airplane-mode
  toggling; this is the highest-value flow to add once the harness is green.

CI wiring is intentionally deferred (don't burn days on emulator-in-CI) — a
documented local `npm run e2e` is the bar for now.
