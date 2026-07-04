# Sprint 4 — "v1.1.0 Native" Dev Instructions

**Objective:** Ship the v1.1.0 native build: everything that cannot go OTA — SSL pinning, widgets, share-import GA — plus accessibility, e2e coverage, sync hardening, and a staging gate for the backend. Exit with a Play-ready AAB and a re-graded scorecard.
**Parent plan:** `docs/product-excellence-plan-2026-07.md` (§3, Sprint 4).
**Prerequisite:** Sprint 3 closed. Read its final report/commits first and verify all gates before starting anything.

---

## Step 0 — Verify state before touching anything

1. Frontend master: `npm test` / `npm run typecheck` / `npm run lint` green. Read the coverage floor from `jest.config.js` (Sprint 3 may have ratcheted it) — that floor is your baseline; raise it if your work grows actuals, never lower.
2. Backend: `pytest -q` green. Confirm Railway prod healthy (`/api/health`).
3. OTA fleet state: `npx eas channel:list` + rollout status. Live Play fleet is v1.0.1 (rtv "1.0.1", appVersion policy). Note which staged rollouts are pending — report to founder if anything is stuck below 100%.
4. Read `docs/ota-strategy.md` and the repo rules in `docs/sprint-3-instructions.md` §"Repo rules" — all still apply (origin/main is junk; backend auto-deploys on push; bare gitlink advanced with plain `git add backend` after backend push; no `.gitmodules`).

## The dual-fleet reality (read before the build)

`app.json` is already `runtimeVersion: { policy: "fingerprint" }` + version 1.0.2. This sprint bumps **version to 1.1.0** and increments `versionCode` (live fleet is vc5 — check current value; new build likely vc6+). After v1.1.0 ships, there are TWO fleets:
- **v1.0.1 fleet (appVersion rtv "1.0.1")** — still served by the temporary-pin OTA procedure (see sprint-3 doc Task 6.4) until Play adoption makes it negligible.
- **v1.1.0 fleet (fingerprint rtv)** — plain `eas update --branch preview` targets it correctly from repo state.
Every OTA publish from now on must state which fleet it targets. Update `docs/ota-strategy.md` with this dual-fleet section as part of this sprint.

---

## Task 1 (A6) — SSL certificate pinning ⚠️ highest-risk item

Misconfigured pinning = every install bricked for networking until a new native build. Design for failure:

- Use a config-plugin-friendly library (e.g. `react-native-ssl-public-key-pinning` — SPKI pinning over OkHttp/TrustKit, Expo-compatible, JS-configurable). Avoid anything requiring manual native code.
- **Pin SPKI hashes, not leaf certs.** Railway/Supabase rotate Let's Encrypt leaves frequently. Pin the issuing intermediate/root SPKIs and include ≥2 backup pins per domain.
- Scope: the Railway API domain + Supabase domain only.
- **Escape hatch is mandatory:** pinning config must be toggleable/updatable from JS (OTA-updatable kill switch + remote-config-style disable via an unauthenticated backend endpoint or update). If the library can only hard-bake pins natively, implement fail-open (report to Sentry, allow connection) rather than fail-closed for v1.1.0, and say so in the report.
- Write `docs/ssl-pinning-runbook.md`: current pins, how they were derived (openssl commands), rotation procedure, kill-switch procedure, what an outage looks like in Sentry.
- Verify on a real build: correct pins → works; deliberately wrong pin on a test build → fails the way you designed (and Sentry sees it).

## Task 2 (D6) — Home-screen widgets (Android first)

- Android: `react-native-android-widget` (Expo config plugin) — "Spent today" + budget-ring widget reading from a small shared store the app refreshes on each transaction write. Deep-link tap → fast entry.
- iOS widgets require an app-extension target (`@bacons/expo-apple-targets`) **and** the iOS build/test loop is still blocked on the founder's macOS/TestFlight decision — treat iOS widgets as out of scope; note it in the report.
- Unit-test the widget data-provider logic (pure module in `src/lib/`).

## Task 3 — Share-import GA

- The share/import JS flow shipped earlier (`src/lib/shareIntentHandler.ts`) but the **native intent filter / share extension only activates with a native build** — that was the whole reason v1.1.0 exists (see memory + `docs/ota-strategy.md`).
- Verify the config plugin/intent filters are in `app.json`/`app.config.js`, the handler wires on cold + warm start, and shared text lands in AI parse → prefilled fast entry.
- Device-test the full path on the preview APK: share a payment SMS/text from another app → Ari opens → parsed prefill → save.

## Task 4 (D2 + D3) — Recurring surfacing + UPI settle-up

JS work that rides the same release:
- **D2:** "Upcoming charges" — surface `recurringEngine` projections (next 30 days) as a Dashboard card + a section in Trends; if Sprint 3's bill-reminders card exists, unify rather than duplicate (one "Upcoming" card, two data sources).
- **D3:** In group balances, a "Settle now" button per member generating a UPI intent deep link (`upi://pay?pa=<vpa>&pn=<name>&am=<amount>&cu=INR`, URL-encoded) using the stored `upi_vpa`. Missing VPA → prompt to request it. Record settlement against the group on return/confirm (existing `/groups/*` settlement endpoints — verify before building new ones).
- Unit tests: UPI URI builder (encoding, amount formatting) and upcoming-charges projection.

## Task 5 (C2) — Accessibility pass

- Every touchable: `accessibilityLabel` + `accessibilityRole`; hit targets ≥44pt (audit small icons — filters, close buttons, FAB row).
- Font scaling: app must survive OS font scale 1.3× without clipped money amounts (fix with `adjustsFontSizeToFit`/`numberOfLines`/layout where needed).
- Contrast: verify text-on-background pairs in the shipped palette meet WCAG AA for body text; document any accepted misses.
- Android TalkBack smoke on the money paths (add/edit/delete). Keep a checklist in `docs/accessibility-audit-2026-07.md`.

## Task 6 (C5) — Maestro e2e suite

- Maestro on Windows drives Android emulator flows. Set up `\.maestro/` with flows: login (demo creds) → add expense → edit it → delete it; budget create; tab navigation smoke; offline add → airplane-mode off → sync verify.
- These are the coverage gate for screens (unit gate deliberately excludes them). Wire into CI if emulator-in-CI is feasible quickly; otherwise a documented local `npm run e2e` script is fine for now — don't burn days on CI emulators.

## Task 7 (B5) — Railway staging gate

- Create a Railway **staging** service/environment deploying the backend's `staging` branch against a separate Supabase project or schema (NEVER prod data). `railway` CLI is linked; if service creation needs the dashboard, prepare everything else and hand the founder a 5-minute checklist.
- New flow (document in `backend/CLAUDE.md`): feature → commit to `staging` branch → auto-deploy staging → verify → merge/push `master` (prod). Prod pushes stop being the first place code runs.
- CI: backend workflow runs on both branches.

## Task 8 (B6) — Sync engine hardening

- `src/lib/syncEngine.ts`: raise coverage (was 47% pre-Sprint-3) to ≥70% — queue drain order, retry/backoff, 409 handling, partial-failure paths.
- Write `docs/sync-conflict-policy.md`: what wins on conflict and why (server-wins vs last-write, per field), duplicate-suppression guarantees.
- Telemetry: sync failures and queue depth reported to Sentry/analytics so silent sync rot is visible.

## Task 9 — Build & release

1. All gates green (both repos), coverage ratcheted to new actuals.
2. Bump `app.json`: `version: "1.1.0"`, increment `versionCode`. Prebuild sanity: `npx expo prebuild -p android --clean` compiles locally or via EAS.
3. `npx eas build --platform android --profile preview` → install APK on device → run the device checklist: share-import, widget, pinning-positive, notifications, money paths, TalkBack smoke.
4. Production AAB: `npx eas build --platform android --profile production`. **Play submission is a founder action** — hand over the AAB link + suggested staged-rollout % + release notes.
5. iOS: still gated on macOS/TestFlight decision — restate in report.
6. Update `docs/ota-strategy.md` (dual-fleet) and mark shipped items in the excellence plan.

---

## Definition of done

- [ ] Pinning live with backup pins + kill switch + runbook; failure mode verified deliberately.
- [ ] Android widget on device; data provider unit-tested.
- [ ] Share-import verified end-to-end on the preview APK.
- [ ] Upcoming-charges card + UPI settle-up live; URI builder tested.
- [ ] Accessibility checklist complete; TalkBack smoke passed.
- [ ] Maestro flows runnable via one command; core money paths covered.
- [ ] Railway staging gate live (or founder checklist handed over); flow documented.
- [ ] syncEngine ≥70% lines; conflict policy doc; sync telemetry flowing.
- [ ] v1.1.0 preview APK device-verified; production AAB built; founder handoff with release notes.
- [ ] Both docs (ota-strategy, excellence plan) updated; coverage floors ratcheted.

## Founder decisions surfaced by this sprint

1. Play staged-rollout % and timing for v1.1.0.
2. iOS/TestFlight: provide macOS or approve EAS iOS build + App Store Connect setup.
3. Staging Supabase project provisioning (if a new project is needed).
