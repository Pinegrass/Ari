# Maestro E2E Flows

End-to-end flows for Ari, run with [Maestro](https://maestro.mobile.dev/) against
a release build on an emulator or device.

```bash
npm run e2e                       # runs every flow in .maestro/
maestro test .maestro/login_flow.yaml   # a single flow
```

## ✅ Status: verified green in CI (2026-07-23, run 30043818806)

All 5 flows pass end-to-end on the CI harness. The suite runs on pushes/PRs to
`master` and nightly via `.github/workflows/maestro-e2e.yml`: an EAS **cloud**
build of the `e2e` profile (release APK), then a manually brought-up emulator
(plain `sdkmanager`/`emulator`/`adb` shell steps — the org Actions policy blocks
third-party emulator actions), then all 5 flows.

## Harness gotchas (hard-won, don't rediscover)

- **AVD is hand-written** (`maestro.ini` + `config.ini`) — `avdmanager create`
  silently no-ops on the current runner cmdline-tools. `hw.cpu.arch=x86_64` is
  mandatory (emulator defaults the AVD to arm and dies), as are real
  `hw.lcd.*` metrics (default 320x480 pushes dashboard content below the fold).
- **AOSP `default` image, not `google_apis`** — the Pixel Launcher ANR'd
  repeatedly under swiftshader and its dialog intercepted taps.
- **First launch after `clearState` shows Onboarding**, not Splash — flows must
  tap Skip first.
- **Maestro matches element text exactly** — `₹500` ≠ `500`, and `← Back` ≠
  `Back`. Prefer `accessibilityLabel`s (e.g. `Go back`).
- **TextInput placeholders are invisible to Maestro** (RN doesn't expose hints
  to the a11y tree). Assert rendered text instead.
- **Fade-in animations race assertions** (splash tagline, dashboard
  AnimatedEntry) — use `extendedWaitUntil`, not immediate `assertVisible`.
- **Recent list is windowed** — rows enter the hierarchy only when scrolled on
  screen; scrolling to the section header is not enough.
- **Test data persists server-side** on `demo@ari.app` (clearState is local
  only); each login_flow+add_transaction run adds entries. Flows are written to
  tolerate this; a cleanup step or dedicated E2E account is a future
  improvement.

## Flows

| Flow | Covers |
|------|--------|
| `login_flow.yaml` | onboarding skip → splash → email/password demo login → Home |
| `navigation_flow.yaml` | Home / Trends / Tomo / More tab smoke |
| `add_transaction_flow.yaml` | keypad add ₹500 → save → scroll to Recent → long-press edit → update |
| `tomo_chat_flow.yaml` | quick-prompt send → transcript render |
| `export_flow.yaml` | More → scroll → Export Data → back via `Go back` |

## Deferred flows (write once, verified)

- **Budget create** — Budget is no longer a tab; confirm the nav path first.
- **Bill create → notification assert** — needs reminder permission +
  scheduled-notification assertion validated on-device.
- **Offline add → airplane-mode → sync verify** — needs device airplane-mode
  toggling; highest-value flow to add next.
