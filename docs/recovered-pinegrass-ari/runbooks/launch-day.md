# Launch-day runbook — Ari Android (Play Store)

For the team driving the production rollout. Print this, or pin it on a second monitor.

## Definition of "launched"

The release is considered launched when **all** of the following are true:

1. Build is live on Play Production track at a non-zero staged rollout percentage.
2. A real device on the Play production track has been smoke-tested successfully (sign-in, session persists across kill+relaunch).
3. Sentry release is tagged and ingesting events from the new build.
4. Crashlytics has at least one heartbeat from the new build's `versionCode`.

If any of these are not true 2 hours after `eas submit` returned success, escalate per "Rollout stalled" below.

---

## Pre-flight checklist (do not skip)

Run through this **before** hitting "Roll out" in Play Console.

- [ ] Backend `/api/health` returns 200 on Railway production.
- [ ] Backend `DELETE /api/account` returns 200 for a test user (use staging account).
- [ ] Backend `/api/auth/login` returns both `token` and `refresh_token` (the new field your dev added).
- [ ] Firebase Console → `com.pinegrass.ari` → SHA-1 fingerprints list includes the **Play App Signing key** SHA-1 (not just upload key).
- [ ] Google Sign-In test from a Play internal-track install succeeds (not from a local debug build — those use the debug keystore).
- [ ] Sentry has a release tagged for this `versionCode`. Releases that aren't tagged make the rollback decision impossible.
- [ ] Privacy policy is live at its URL and linked in Play Console → App content.
- [ ] Account deletion URL is live and linked in Play Console.
- [ ] Play Console → Data Safety form matches reality (no claims about features that aren't shipped).
- [ ] One human (Augustus or designated launch driver) is at a desk for the next 4 hours.

If any pre-flight item fails, **do not roll out**. Fix it first.

---

## Rollout plan

1. Submit AAB via `eas submit`.
2. Wait for Play to finish processing (5–15 min).
3. Open Play Console → Production → Edit release → set rollout to **20%**.
4. Start watch (Sentry, Crashlytics, /api/health monitor).
5. Hold for **24 hours**.
6. If gates pass: promote to **50%**. Hold 24 hours.
7. If gates still pass: promote to **100%**.

### Promotion gates (all must be green to advance)

- Crashlytics **crash-free users ≥ 99.5%** on the new `versionCode`.
- Sentry: no spike in `google_sign_in_failed:*` events (events per active user not higher than the prior release's baseline).
- Sentry: no spike in `auth.refresh_failed` or `server.error` events.
- Backend: `/api/health` uptime ≥ 99.9% in the rollout window.
- No new 1-star reviews mentioning crashes, sign-in failure, or lost data.

If any gate is amber, **hold** — do not roll back unless red.

---

## Triage decision tree

### 🔴 Scenario 1 — Google sign-in failing in production

**Signal:** Sentry: spike in `google_sign_in_failed:10` (DEVELOPER_ERROR).

**Diagnosis:** Play Signing SHA-1 not in Firebase, or `google-services.json` is stale.

**Action:**
1. Halt rollout in Play Console (do not roll back the 80% on the old build).
2. Open Play Console → App signing → copy SHA-1 of **App signing key certificate**.
3. Confirm it is listed in Firebase Console → Project settings → `com.pinegrass.ari` → SHA fingerprints. If not, add it.
4. Download fresh `google-services.json`.
5. Rebuild via `eas build --platform android --profile production`.
6. Submit new build, restart rollout at 20%.

**Time to recovery:** 60–90 minutes (the native rebuild dominates).

**Not a fix:** doing an OTA. `google-services.json` is read at native init, OTA can't help.

---

### 🔴 Scenario 2 — Session not persisting after kill+relaunch

**Signal:** User reports / Sentry: spike in `auth.session_expired` immediately after `auth.login_success`.

**Diagnosis:** Either the backend isn't returning `refresh_token`, or the client isn't calling `setSession()` with it.

**Action:**
1. `curl https://web-production-7c65f.up.railway.app/api/auth/login` with a test account → confirm response contains both `token` and `refresh_token`.
   - If missing: backend deploy didn't take. Re-deploy from Railway dashboard.
2. If backend is fine: the client logic regressed. Sentry breadcrumbs from `recordAuthEvent` will show the call sequence.
3. Fix is JS-only → ship via `eas update --branch production`. Then halt rollout, wait 10 min for OTA to propagate, resume rollout.

**Time to recovery:** 15–30 minutes (OTA path).

---

### 🔴 Scenario 3 — Crash spike on a specific Android version

**Signal:** Crashlytics: crash-free users drops below 99.5%, concentrated on one Android version (e.g. Android 14 only).

**Action:**
1. Halt rollout immediately.
2. Inspect Crashlytics stack trace. If it's RN / native, look at the differences between this build and the prior release (gradle deps, expo SDK).
3. If fix is JS-able: OTA fix, restart rollout.
4. If fix needs native: rebuild, resubmit. Users on the affected version stay on the old build until the new one is live, which is the desired outcome.

**Time to recovery:** 30 min (OTA) to 2 hours (native).

---

### 🟡 Scenario 4 — Backend latency rising

**Signal:** `/api/health` p95 > 2 seconds, or Sentry breadcrumbs show fetch times trending up.

**Action:**
1. Open Railway dashboard, check service metrics.
2. If memory or CPU is pegged: scale the service up (Railway → service → settings → resources).
3. If a specific endpoint is slow: rate-limit it on the client (in `src/api/`) while the backend team investigates.
4. **Do not halt the rollout** unless errors are also spiking — slow ≠ broken.

---

### 🟡 Scenario 5 — Play takes down the listing

**Signal:** Email from Google Play saying the app has been suspended / removed.

**Most likely cause:** Data Safety form mismatch, missing privacy policy URL, missing account deletion URL, false advertising in the listing copy.

**Action:**
1. Read the email carefully — Google states the specific policy violation.
2. Fix the violation:
   - Privacy policy issue → publish/update the policy, re-link in Play Console.
   - Data Safety mismatch → reconcile the form with reality, re-submit.
   - Account deletion → confirm both in-app and web URL deletion paths exist, re-submit.
3. Submit an appeal via the email link.

**This is the scenario that wastes the most time** because Play review can take days. Mitigation = the pre-flight checklist.

---

### 🟡 Scenario 6 — Rollout stalled

**Signal:** 2+ hours after `eas submit` returned success, the new build is not visible in Play Console as "Available."

**Action:**
1. Check Play Console → Release dashboard → recent build status. It may be in "Update under review."
2. If under review > 6 hours: open a Play Console support ticket. They are usually fast on production releases with prior history.
3. Do not resubmit a new build — it puts you at the back of the queue.

---

## Communication template

When something breaks, send this to the team within 10 minutes of detection:

```
SUBJECT: [Ari launch] <one-line problem>

Status: <investigating | mitigating | resolved>
Detected at: <time, timezone>
What we see: <one paragraph: the signal>
Impact: <which users / what % / what they can't do>
Owner: <name>
Next update: <time>
```

Resend on every meaningful update or every 30 min, whichever is sooner.

---

## Rollback policy

- The staged rollout itself **is** the rollback mechanism for new users — they get the old version if you halt at <100%.
- Existing users on the new version cannot be rolled back from Play. They stay on whatever is highest `versionCode` they've received. The fix path is forward: OTA if JS, new native build if not.
- Do **not** lower the version code to push an older AAB. Play will reject it.

---

## Post-launch ritual (24h, 7d, 30d)

- **24h:** snapshot Crashlytics crash-free users, Sentry events per session, /api/health uptime, store install count. File in a "Launch v1" channel/note.
- **7d:** retention check — D1 and D7 vs. any prior baseline. Top 5 Sentry issues triaged.
- **30d:** the three KPIs decided in the "30-day metrics" planning doc. If retention is < target, run user interviews before adding features.
