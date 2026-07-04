# Sprint 4 — v1.1.0 "Native" · Founder Handoff

**Date:** 2026-07-05 · **Frontend HEAD:** `c64d72c` (master) · **Backend HEAD:**
`b128d9e` (master, deployed + `/api/health` verified) · **Gitlink:** matched.

All code is committed to `master`. Gates green: **358 FE tests**, typecheck + lint
(0 errors) clean; **84 backend pytest**; coverage floor ratcheted to
**57/59/50/58**. `expo prebuild -p android --clean` finished clean (all native
config resolves). Nothing has been submitted to Play and no cloud build has been
triggered — those are your calls (below).

---

## What shipped this sprint

| Task | Outcome |
|------|---------|
| A6 SSL pinning | SPKI pins (Railway + Supabase), ≥2 root backups each, OTA kill switch, fail-open + Sentry. `docs/ssl-pinning-runbook.md`. Failure mode unit-verified; on-device negative test in checklist. |
| D6 Android widget | "Spent today" + budget-ring widget, config plugin, tested data provider, `ari://add` deep-link tap. iOS widgets OUT (macOS decision). |
| D (share) | **Found + fixed a GA blocker:** the ACTION_SEND filter had no code to read `EXTRA_TEXT`. Integrated `expo-share-intent`; verified in prebuild. |
| D2/D3 | Upcoming-charges card (bills **+** recurring projections, merged) + Trends section; per-member UPI "Settle now" with tested `buildUpiUri`. |
| C4 theme | All 5 tabs + AddTransaction on `useColors()`. Dark palette drafted; **awaiting your sign-off** (preview artifact). Gate left OFF. |
| C2 a11y | Money-path labels/roles, 44pt targets, 1.3× font survival; `docs/accessibility-audit-2026-07.md` + TalkBack checklist. |
| C5 Maestro | Flows refreshed to v1.1.0 UI; `npm run e2e`. **Not yet run green on an emulator** (the required gate before CI). |
| B5 staging | `env_guard.py` (staging can't boot against prod DB) + CI on both branches + `staging` branch pushed. Infra checklist: `docs/railway-staging-setup.md`. |
| B6 sync | syncEngine 53%→**96%** lines + telemetry; `docs/sync-conflict-policy.md`. |

---

## Suggested Play rollout

**Staged, 20% → 50% → 100%** over ~5 days, gated on Sentry:

1. **20%** day 0. Watch: `ssl_pin_validation_failed` (broad spike = pin problem →
   flip the kill switch per the runbook), crash-free rate, `sync_stuck`.
2. **50%** at ~48h if crash-free ≥ 99.3% and no pin-mismatch spike.
3. **100%** at ~day 5. This is a fingerprint-native build (pinning, share-intent,
   widget) — it can't be rolled back OTA, so the gate matters more than usual.

Halt/rollback trigger: any broad `ssl_pin_validation_failed` spike, or crash-free
< 99%.

## Release notes (Play "What's new")

```
• Home-screen widget: see today's spend and budget at a glance (Android).
• Share a payment SMS or text straight into Ari to log it in seconds.
• Upcoming charges: bills and recurring payments for the next 30 days, together.
• Settle up in groups with one tap via any UPI app.
• Faster, tougher, more private: certificate pinning, smoother sync, and
  accessibility improvements throughout.
```

## Device checklist — run on the preview APK before the production AAB

- [ ] **Pinning (positive):** log in, add a transaction, open Tomo — all network OK.
- [ ] **Pinning (negative, throwaway build):** corrupt one Railway pin → API/auth
      fail AND a `ssl_pin_validation_failed` lands in Sentry. (See runbook §6.)
- [ ] **Share-import:** from Messages/another app, share a payment SMS → Ari opens
      → parsed prefill → save. (Cold + warm start.)
- [ ] **Widget:** add the "Spent today" widget → shows spend + ring → tap → opens
      fast entry. Add a txn → widget updates.
- [ ] **UPI settle:** in a group you owe, "Settle now" → a UPI app opens prefilled
      → confirm → split marked settled.
- [ ] **Money paths + TalkBack:** add / edit (long-press) / delete with TalkBack on
      (see accessibility-audit checklist).
- [ ] **Reminders + upcoming charges card** render.
- [ ] **Maestro:** `npm run e2e` on the emulator — fix any selector the run flags,
      then commit the confirmed-green set.

## Build commands (when you're ready)

```bash
# 1. Preview APK (internal) — for the checklist above. versionCode auto-bumps vc5->vc6.
npx eas build --platform android --profile preview

# 2. After the checklist passes — production AAB for Play.
npx eas build --platform android --profile production
# then hand the AAB to the Play Console (staged rollout %, above).
```

---

## Your to-do list (ordered)

1. **OTA queue (from sprint start):** Sprint 3 (`1b9e1a66`) is still at **20%** on
   `preview`, published ~before this session — soak not elapsed + I can't see
   Sentry. When it's had its 24h quiet and Sentry's green:
   `npx eas update:edit --group 1b9e1a66-8c92-499d-8188-8219f77c2711 --rollout-percentage 100`
2. **Dark palette sign-off (C4):** review the preview (light vs dark from the real
   tokens) → "ship it" and I flip `DARK_ENABLED`, or name tweaks. One tightest
   pair flagged: `ink` on `forest` (primary button) — confirm it clears 4.5:1.
3. **Trigger the preview APK build** (or tell me to) → run the device checklist.
4. **Staging infra** (`docs/railway-staging-setup.md`): create the staging Railway
   service + a separate staging Supabase project (~5 min, dashboard).
5. **iOS:** provide macOS / approve EAS iOS build + App Store Connect setup — iOS
   widgets + share extension are blocked on this.
6. **PostHog:** `EXPO_PUBLIC_POSTHOG_KEY` is still unset — the whole
   onboarding/bills/sync funnel records nothing until it's set in EAS env.
7. **Production AAB + Play submission** (after checklist) — your action; I'll hand
   the AAB link once the preview passes and you say go.
