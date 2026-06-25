# Sprint 1 — Resumption Checklist (READ THIS FIRST)

> **Paused:** 2026-06-08 evening, at CHECKPOINT 3.3 (OTA gate), **BLOCKED** by an
> EAS Update asset-processing outage (see `sprint-1-followups.md` #8).
> **Sprint goal remains achievable** — only the OTA verification is pending, on an
> external dependency (EAS Update). Estimated remaining work: ~30–60 min assuming
> EAS cooperates.

## Where we are
- **Phase 1 (code):** ✅ DONE — committed `1d2b8d0` (OTA wiring + DataContext hardening).
- **Phase 2 (build):** ✅ DONE — AAB vc4 (v1.0.1) built, signed `kbPfFmViIz`, saved to
  `C:\Users\Augustus Rex\Documents\ari-releases\ari-v1.0.1-vc4-production-2026-06-08.aab`.
  versionCode auto-increment fixed in `eas.json`, committed `d10ba3a`.
- **Phase 3 (QA + OTA gate):** ⏸️ PAUSED at 3.3. The OTA dry-run could not publish
  (EAS asset processing timed out — twice). Device-side sequence never ran.
- **Phase 4 (Play submission):** ⛔ NOT STARTED — hard-gated behind a 3.3 PASS.

## ON RESUMPTION — do these in order

1. **Check EAS status** — https://status.expo.dev — wait for **"EAS Update:
   operational"** with no recent/active incidents. (It read green during the
   failures, so also just attempt the publish — green status alone isn't proof.)

2. **Confirm working tree matches end-of-session state** (no accidental overnight
   changes):
   - `git rev-parse --short HEAD` → should be **`d10ba3a`**
   - `git status --short` → expected: `M CLAUDE.md`, `M backend`, untracked `docs/`,
     `ota-update.err`, `ota-update.json`, `ari-production-1.0.0-2.aab`,
     `ari_assets_playstore/`, `scripts/play-console-automation.mjs`.
     (`ota-dry-run-*.log` and `dist/` are gitignored — won't appear.)
   - **Do NOT** commit CLAUDE.md, backend, or docs/ (followups #2/#3 — out of scope).

3. **Re-arm the logcat tail** (clear buffer first; confirm phone `64cb8e9a`
   connected/authorized via `adb devices`):
   ```
   adb logcat -c
   adb logcat | grep --line-buffered -iE "expo-updates|exupdates|reload|EXManifest" | tee ota-dry-run-logcat-<today>.log
   ```
   (Narrow the filter to expo-updates tags — yesterday's broad `updat` filter caught
   NetworkPolicy noise.)

4. **Retry the OTA publish** (bounded; `--json`, no `tail` pipe):
   ```
   npx eas update --branch production --message "Sprint 1 OTA dry-run, no functional change" --non-interactive --json
   ```
   Hard-bound ~3 min. On success: parse JSON → capture **update group ID,
   manifest URL, runtime version (must be 1.0.1)**; report immediately.

5. **If it still fails:** switch to a verbose trace to localize the stall —
   `EXPO_DEBUG=1 eas update --branch production --message "…" --non-interactive`
   (NO `--json`). Also try `--clear-cache` and/or a fresh `dist/` export. If it
   persists, the blocker is Expo-side → status/support report.

6. **If publish succeeds:** Rex runs the **3-sequence phone observation** per the
   Phase 3.3 brief — cold-launch → background 30s → foreground → cold-launch again.
   Expected Sentry breadcrumbs in order:
   1. `update available, fetching`
   2. `update fetched and staged for next launch`
   3. (on background) `applying staged update via reloadAsync`
   Cross-reference the logcat tail for the native expo-updates check/download/reload.

7. **On 3.3 PASS:**
   - **Clean up the no-op update** from the production branch:
     `npx eas update:roll-back-to-embedded --branch production --platform android --message "Sprint 1 OTA dry-run cleanup — roll back to embedded"`
   - **Proceed to Phase 4** — Play Console → Production → new release, upload the saved
     AAB, release notes (en-GB) per brief, **India only, 20% staged rollout**, start
     rollout.
   - Then write the final sprint report (`docs/sprint-1-report-2026-06-XX.md`) and
     open the `docs/sprint-1-report` PR.

## Context carried over (so a fresh session needn't re-derive)
- **Install method = Play Internal *testing* track** (NOT Internal App Sharing). IAS
  re-signs with a third debug-style key (`22:22:FD:69…`) that isn't in Firebase →
  Google Sign-In fails. The internal *testing* track uses the production Play App
  Signing key (`27:AC…`, already registered). See followups context.
- **OTA dry-run approach = A**: publish no-op to the `production` branch (the build
  listens on the `production` channel; runtime 1.0.1 has zero live users, so blast
  radius is the one test device). Cleanup via roll-back-to-embedded after PASS.
- **eas-cli is 20.0.0** — `version:set --value` and `build --auto-increment` flags do
  NOT exist; versionCode auto-increment is handled by `autoIncrement: true` in
  `eas.json` (already committed).
