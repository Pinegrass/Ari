# Sprint 1 — Follow-up Notes

> Sprint: Ari Mobile P1 Native Build (versionCode 4, version 1.0.1)
> Purpose: log items noticed during the sprint that are **out of scope** for this
> build. Nothing here is actioned within Sprint 1. Each item carries a disposition.

---

## 1. OTA apply-on-background vs apply-on-active — CLOSED (blessed)

**Observed (Phase 1):** The brief specified applying a staged OTA update "on next
cold launch or AppState **background→active** transition." The implemented code in
`src/lib/otaUpdates.ts` (`registerOtaReloadHandler`) instead applies on the
**`next === 'background'`** transition (when the app *leaves* the foreground),
plus relies on expo-updates auto-applying a staged update on the next cold launch.

**Rationale:** Reloading as the app backgrounds means the user returns to the
fresh bundle with **zero visible reload**. Reloading on foreground-return
('active') would cause a visible reload as the user re-enters the app. Both honor
the "never mid-session" constraint; the background approach is better UX.

**Disposition:** CLOSED. CTO (Rex) reviewed and **blessed** this as an
intentional improvement over the brief's wording. Documented in the Phase 1 report
and to be carried into the final sprint report as an "intentional improvement over
brief." No further action.

---

## 2. Backend submodule pointer is dirty — WEEKEND TRIAGE

**Observed (pre-flight):** The `backend` submodule working tree shows
`dc60cc5-dirty` — i.e. the submodule is checked out at `dc60cc5` (the verified
backend P1 commit) but has **uncommitted changes inside it**, while the parent
repo's last commit still points the submodule at `bc548fa`.

**Disposition:** WEEKEND TRIAGE. Per sprint scope, the backend is DONE and must
**not** be touched. For Sprint 1, the parent repo's submodule pointer is left at
`bc548fa` (the Phase 2 commit excludes the submodule pointer entirely). The dirty
submodule working tree and the question of whether/when to advance the parent
pointer to `dc60cc5` is a **separate review** for the weekend, alongside the
deferred `ejjy → Pinegrass` repo migration. Not actioned in this sprint.

---

## 3. CLAUDE.md uncommitted changes — SEPARATE COMMIT LATER

**Observed (pre-flight):** `CLAUDE.md` has uncommitted modifications (+55 / −18).
This is parallel work (the "previous round" docs refresh referenced in the brief),
not Sprint 1 scope.

**Disposition:** SEPARATE COMMIT. The Phase 2 commit explicitly **excludes**
`CLAUDE.md`. It is left uncommitted in the working tree and should be committed
separately, outside this sprint. Not actioned here.

---

## 4. Expo package versions slightly behind expected — INFORMATIONAL

**Observed (bundler smoke test):** `npx expo start` reports several packages a
patch behind the versions expected by Expo SDK 54:

- `expo@54.0.34` → expected `~54.0.35`
- `expo-font@14.0.11` → expected `~14.0.12`
- `expo-secure-store@55.0.13` → expected `~15.0.8`
- `expo-updates@29.0.17` → expected `~29.0.18`

The bundler starts cleanly regardless (warnings, not errors). `expo-secure-store`
shows a major-version mismatch in the warning text (`55.x` installed vs `15.x`
"expected") which looks like an Expo compatibility-table quirk rather than a real
regression, since the app builds and tests pass.

**Disposition:** INFORMATIONAL / NOT ACTIONED in Sprint 1. Bumping dependency
versions mid-sprint is out of scope and would add build risk. Flag for a future
dependency-hygiene pass. Note `expo-updates` is the OTA library — worth confirming
the patch delta is irrelevant to OTA behavior during the Phase 3 dry-run (it is
not expected to matter; the dry-run is the authoritative test regardless).

---

## 5. versionCode auto-increment / CLI syntax — POST-SPRINT (one item actioned to unblock)

**Observed (Phase 2):** The first production build baked `versionCode 3` (same as
the live v1.0.0 build `dfc7002d`), which Play would reject as a duplicate. Root
cause: `eas.json` sets `appVersionSource: "remote"` but the `production` profile
has no `"autoIncrement": true`, so EAS used the remote-stored counter (3) as-is
instead of bumping to 4. Remediation attempts then surfaced two CLI-version gotchas
below.

### 5a. Brief / older docs use stale `version:set --value` syntax
`eas build:version:set --platform android --value <N>` is **eas-cli ≤ 19.x** syntax.
In the installed **eas-cli@20.0.0** (latest available 20.1.0), `build:version:set`
is **interactive-only** — its flags are just `[-p android|ios] [-e PROFILE]`; there
is **no `--value` flag**. It prompts for the number interactively.

### 5b. `eas build` has no `--auto-increment` flag in 20.0.0 either
The natural non-interactive fallback — `eas build … --auto-increment` — **also does
not exist** in eas-cli@20.0.0. The build command's only version/submit-related flag
is `--auto-submit` / `--auto-submit-with-profile`. There is **no increment flag on
the build command** in this CLI version.

**Actual working mechanism in eas-cli@20.x:** put `"autoIncrement": true` inside the
build profile's `android` block in `eas.json` (with `appVersionSource: "remote"`).
Then a plain `eas build` bumps the remote counter automatically. The only other
non-interactive route is piping a value into the interactive `build:version:set`
prompt, which is unreliable.

**Disposition:**
- **5b — DONE in Sprint 1, commit `d10ba3a`.** Added `"autoIncrement": true` to
  **both** the `production` and `preview` android profiles in `eas.json`. Verified
  working: the next `eas build` printed "Incremented versionCode from 3 to 4", and
  both `build:version:get` and the build record (`6f4fb866`) confirmed
  `versionCode 4`. The `autoIncrement: true` × `appVersionSource: "remote"`
  interaction works as expected. This permanently prevents the vc-collision failure
  mode for future builds. Kept this entry as the historical record of why the change
  exists.
- **5a — open (durable note).** Internal briefs/docs that still reference the
  `eas build:version:set --value <N>` syntax should be updated; that flag does not
  exist in eas-cli 20.x. Not blocking anything — informational for future briefs.

---

## 6. Brief 3A checklist asked for "edit transaction" smoke test — CLOSED (informational)

**Observed (Phase 3, codebase audit):** The Sprint 1 brief's 3A smoke checklist asked
the tester to "edit that transaction (change amount to ₹150)." **Ari has no
edit-transaction feature** — verified absent at every layer: no `updateTransaction`
API (no PUT/PATCH to `/transactions/:id`), no context method, no UI affordance, and
no backend endpoint. To change a saved transaction a user must delete and re-add.
This is **pre-existing v1.0.0 behavior, not a sprint regression** — the sprint
commits did not touch any transaction-edit path (none exists).

**Disposition:** CLOSED (informational; not actionable). Lesson for future sprints:
audit the codebase for a feature's existence before writing test checklists that
assume it. The product-gap itself is captured in `sprint-2-backlog.md` #1.

---

## 7. Brief 3A checklist mentioned swipe-to-delete — CLOSED (informational)

**Observed (Phase 3, codebase audit):** The brief referenced swipe-to-delete on
transaction rows. **Ari has no swipe gesture on transaction rows** — no `Swipeable`
/ `renderRightActions` / gesture-handler swipe anywhere. Delete is via **trash-icon
tap** on the main Transactions list (`TransactionsScreen` → `TransactionItem`
`showDelete` → `DeleteConfirmSheet`) or **long-press** in Smart Ledger
(`SmartLedgerScreen`, `delayLongPress 500`). Pre-existing v1.0.0 behavior; the delete
*UI/gesture* code was not modified this sprint (though the `deleteTransaction` logic
in `DataContext.tsx` was hardened in commit `1d2b8d0`, fix #3).

**Disposition:** CLOSED (informational; not actionable). Smoke test should use the
trash-tap / long-press delete affordances, not a swipe.

---

## 8. EAS Update asset processing degraded (2026-06-08 evening) — BLOCKING

**Observed (Phase 3.3, OTA gate):** Two attempts to publish the no-op OTA dry-run
update to the `production` branch were blocked by EAS Update's server-side asset
processing:
- **Attempt 1 (`bkait2cpi`):** hung ~52 min on asset upload with no error surfaced;
  process tree killed manually.
- **Attempt 2 (`bb7w2wg46`, 3-min bounded, `--json`):** failed fast with an explicit
  error — `Failed to upload — Asset processing timed out` for the Hermes bundles
  (`dist/_expo/static/js/{ios,android}/index-*.hbc`).

The EAS status page (status.expo.dev) showed **all components green, including
"EAS Update: operational"**, at the time of both failures — status page lagged the
real condition (or it was account/region-specific).

**Not our work:** the AAB build (vc4, correctly signed) is fine; the channel/branch
config is fine (publish reached the export+upload stage); `otaUpdates.ts` is
client-side and was never reached. The OTA machinery is therefore **unproven, not
broken** — the gate is BLOCKED/inconclusive, not FAIL.

**Workaround:** none. The end-to-end OTA gate fundamentally requires a working EAS
Update publish; there is no client-side workaround.

**Resumption plan:** retry tomorrow morning once EAS Update recovers. If it persists,
escalate diagnostics: `EXPO_DEBUG=1` verbose trace (no `--json`), `--clear-cache`, a
fresh `dist/` export, and — if still failing — an Expo support/status report.

**Status:** BLOCKING — Sprint 1 Phase 3.3 (OTA gate) cannot complete until resolved.
Evidence preserved at repo root: `ota-dry-run-logcat-2026-06-08.log` (1.4 MB),
`ota-update.err` (the timeout error), `ota-update.json` (empty, expected), `dist/`.

**RESOLVED 2026-06-11:** EAS Update recovered. The no-op publish succeeded
(group `7ea979a8-1f62-4a7e-80bb-a00a2981c802`, runtime 1.0.1). OTA gate PASSED
(provisional) — see #10. Evidence: `ota-dry-run-logcat-2026-06-11.log`,
`ota-update-2026-06-11.json`.

---

## 10. OTA wiring observability gap — NOT blocking (investigate Sprint 2)

**Observed (Phase 3.3, device observation 2026-06-11):** The OTA dry-run gate PASSED
(provisional) — native OTA delivery verified end-to-end on the test device via the
process-ID swap (`Update available` at 16:35:10 on PID 12941 → `No update available`
on new PIDs 17475/18957, i.e. the device applied the update and is running the new
bundle). Zero errors.

**The gap:** logcat alone cannot confirm whether **our `otaUpdates.ts` JS-layer
wiring** (`checkAndApplyUpdate` / `registerOtaReloadHandler`) fired, or whether the
**native expo-updates auto-check** (`UpdatesController`, `ON_LOAD`) handled the OTA
delivery on its own. All three captured lines are native `UpdatesController` events;
our Sentry breadcrumbs (`update available, fetching` → `update fetched and staged` →
`applying staged update via reloadAsync`) don't surface in logcat by design
(`addBreadcrumb` doesn't console-log). So: **native OTA delivery verified working;
our JS wiring's contribution unconfirmed.**

**Status:** NOT blocking Sprint 1 close (the structural question "does OTA delivery
work?" is demonstrably answered). Investigate in Sprint 2.

**Concrete next-sprint task:** trigger a benign Sentry event from the test device and
inspect the breadcrumb trail for our three OTA breadcrumbs — this disambiguates
whether our JS wiring (esp. the apply-on-background path) actually fires, or whether
native auto-update is doing all the work.

---

## 11. Play Promote-release flow (drafts block Promote) — CLOSED (lesson)

**Promote from Internal testing → Production is the correct path to reuse a
versionCode across tracks — no rebuild needed.** The same artifact/versionCode moves
to Production via "Promote release," not by re-uploading the AAB.

**The gotcha:** a **stale/draft release on the target (Production) track blocks
Promote** — the Promote action appears unavailable until the draft is deleted. In
Sprint 1's vc5 phase, Promote initially looked unavailable; **deleting the stale
draft Production release made Promote available**, and vc5 promoted cleanly to
Production. **No vc6 rebuild was needed** (the rebuild was correctly held pending this
investigation).

**Correction:** an earlier hypothesis framed this as a "track-locking rule"
(uploading to Internal supposedly burns a versionCode per track). **That was a
misreading and is NOT the real constraint.** The real rule is: **Promote works;
stale/draft releases on the target track block Promote.**

**Future workflow:** before concluding Promote is unavailable, **always check the
target track for stale drafts and delete them first.** Prefer Promote over rebuild to
avoid burning a versionCode + a ~23-min build per release.

**Disposition:** CLOSED (lesson). vc5 shipped to Production via Promote.
