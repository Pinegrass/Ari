# Pinegrass Fleet — Audit & Unified Sprint Plan

**Date:** 2026-07-16 · **Author:** CTO/PM (Claude)
**Scope:** Gani Calculator (Play Store, live) · Ari (Play Store, live) · Aritomo Web (Vercel) · Ari backend (Railway/Flask)
**Sprint:** "Ship, Harden, Monetize" — Mon 2026-07-20 → Fri 2026-07-31 (2 weeks)

---

## 1. State of the fleet (audit summary, verified against code on 2026-07-16)

### Gani Calculator — healthy core, unfinished monetization, iOS in flight

Since the 2026-07-02 full audit (docs/audits in the gani repo), the team closed the three
core correctness bugs it flagged — Error-state continuation, `±` on compound expressions
(now wraps as `−(2+3)`), and BigNumber-true memory keys — plus removed hardcoded
Supabase/RevenueCat keys, added CI (typecheck/test/lint), shipped in-app Privacy/Terms,
deleted the deferred-screen debris, and built a Codemagic iOS TestFlight pipeline
(latest commit fixes iOS scratchpad/tutor issues). 175+ tests pass, tsc clean.

**Still open:**

| # | Finding | Severity | Source |
|---|---------|----------|--------|
| G1 | Tape `history` is unbounded and lives in the single `gani_app_state` blob — heavy users get multi-MB JSON parsed on every cold start; one corrupt write loses everything | Medium | audit §1/§4, re-verified: only `scratchHistory` is capped (store.ts:310) |
| G2 | Paywall is wired end-to-end to **stubs** — `purchases.ts` returns `unavailable`; RevenueCat native SDK needs a dev build + store accounts. Tutoring is the paid line and it currently cannot be paid for | High (revenue) | docs/PAYWALL.md |
| G3 | Tutor edge function: in-memory per-instance rate limit + `CORS: *`; the anon key ships in the APK, so extracted keys can burn Anthropic quota to the free cap | Medium (scale) | audit §2 |
| G4 | Display precision still truncates at 14 significant digits (`calculateExpression.ts:443`) while README markets "32-digit precision"; decimal results skip digit grouping (incl. the Indian-system setting) | Medium (trust) | audit §1/§5 |
| G5 | `DESIGN_SPECS.md` still describes a UI that no longer exists — spec has no review authority | Low | audit §5 |
| G6 | Session persistence inconsistent: scratchpad expression survives relaunch, main expression + `M+` memory do not | Low | audit §3 |
| G7 | Tape UX: rows don't hint they expand; "Use in Keypad" reuses only the result, never the expression | Low | audit §3 |
| G8 | `themePref` picker exists in Settings, but `'system'` never resolves via the OS color scheme (`useResolvedScheme` only honors explicit `'dark'`) | Low | re-verified design.ts:78-81 |

### Ari — sprint 4 complete, release stuck in the pipe, observability degraded

Sprint 4 ("v1.1.0 native": SSL pinning, Android widget, share-import fix, upcoming
charges, UPI settle-up, a11y pass, staging guard, syncEngine 96%) finished 2026-07-05
with all gates green (358 FE tests, 84 backend pytest). **Eleven days later the release
is still not shipped** — the founder to-do list from the handoff is largely untouched:

| # | Finding | Severity |
|---|---------|----------|
| A1 | v1.1.0 production AAB never submitted; Sprint-3 OTA group still frozen at 20% rollout. Users are running weeks-old code while finished safety features (pinning) sit on the shelf | High |
| A2 | **Sentry iOS source-map upload disabled** (commit 665bd91, 2026-07-11, `SENTRY_DISABLE_AUTO_UPLOAD: "true"` in codemagic.yaml) — an expedient to unblock the iOS build that leaves iOS crashes unsymbolicated exactly when we're launching iOS | High |
| A3 | `EXPO_PUBLIC_POSTHOG_KEY` unset in EAS env — the entire onboarding/bills/sync funnel records nothing; we're flying blind on the metrics the excellence plan is graded against | High |
| A4 | Staging Railway service + staging Supabase project not created — backend still auto-deploys to prod on every push to master | Medium |
| A5 | Dark palette built, gated OFF, awaiting sign-off; Maestro e2e refreshed but never run green on an emulator (so not in CI) | Medium |
| A6 | Sprint-5 "moat" items not started: proactive Tomo weekly brief, CSV export, Tomo prompt-injection hardening (A7), coverage 60% ratchet | Backlog |
| A7 | Legacy HS256 auth path still accepted alongside Supabase ES256 — standing weak-secret risk with no announced retirement date | Medium |

### Ari backend repo — **critical org-level finding**

`pinegrass/ari-backend` on GitHub is **completely empty** (zero branches). The
production Flask backend — the thing holding every user's financial data — exists only
in `ejjy/ari-backend` (a personal account) and on Railway. No Pinegrass-org code
review, CI, branch protection, or bus-factor protection applies to it. **B0, P0.**

### Aritomo Web — young and thin, no safety net

~1,400 lines of Next.js 14: landing, legal, auth (Google via Supabase), and a new
dashboard with transaction/budget actions and mobile-sync status. Secrets correctly
env-only. But: **zero tests, no CI, no typecheck gate on deploy**, and the Flask
backend still runs `CORS_ORIGIN=*` even though a credentialed browser client now
exists — the web app is the reason to finally lock CORS to `https://aritomo.in`.

---

## 2. Sprint goal

> **Everything we already built reaches users; nothing we run stays outside the org's
> safety net; Gani can take money.**

Three products, one team — so the sprint is organized as four tracks with strict
priorities. P0 items are the sprint. P1 items start only when every P0 in their track
is done. P2 is stretch.

---

## 3. Sprint backlog

### Track 1 — Ship what's built (release ops) — *user value is sitting in inventory*

| ID | Task | Product | Pri | Effort | Acceptance |
|----|------|---------|-----|--------|------------|
| T1.1 | Run the v1.1.0 device checklist (handoff §Device checklist) on the preview APK; fix anything it flags | Ari | P0 | 1d | All 8 checklist items pass on a real device |
| T1.2 | Build production AAB, submit to Play, staged rollout 20%→50%→100% gated on crash-free ≥99.3% and no `ssl_pin_validation_failed` spike | Ari | P0 | 2d + soak | 100% rollout by sprint end or a documented halt |
| T1.3 | Promote the frozen Sprint-3 OTA group 20%→100% after 24h quiet | Ari | P0 | 15min | `eas update:edit --rollout-percentage 100` executed |
| T1.4 | Re-enable Sentry iOS artifact upload — fix the Codemagic failure properly (auth token / upload step) instead of the `SENTRY_DISABLE_AUTO_UPLOAD` bypass | Ari | P0 | 0.5d | iOS build green **with** symbolicated test crash visible in Sentry |
| T1.5 | Set `EXPO_PUBLIC_POSTHOG_KEY` in EAS env (+ Vercel for web); verify events land | Ari/Web | P0 | 0.5d | Onboarding funnel visible in PostHog |
| T1.6 | Dark palette sign-off → flip `DARK_ENABLED`, ship as OTA | Ari | P1 | 0.5d | Theme toggle live; `ink`-on-`forest` pair verified ≥4.5:1 |
| T1.7 | Gani + Ari iOS TestFlight builds through the now-working Codemagic lanes; internal testing group | Both | P1 | 1d | Both apps installable via TestFlight |

### Track 2 — Harden the platform (security & org hygiene)

| ID | Task | Product | Pri | Effort | Acceptance |
|----|------|---------|-----|--------|------------|
| T2.1 | **Migrate the Flask backend into `pinegrass/ari-backend`**: push full history, add CI (pytest + pip-audit), branch protection on master, repoint Railway auto-deploy | Backend | **P0** | 1d | Railway deploys from the org repo; ejjy remote archived |
| T2.2 | Lock backend CORS: `*` → `https://aritomo.in` (+ localhost allowlist for dev). Mobile clients are unaffected (no Origin header) | Backend | P0 | 0.5d | Web dashboard works; cross-origin browser calls rejected |
| T2.3 | Create staging Railway service + staging Supabase project per `docs/railway-staging-setup.md`; prod deploys become explicit promotions | Backend | P1 | 0.5d (founder: ~10min dashboard work) | Push to master no longer touches prod directly |
| T2.4 | Gani tutor edge function: Postgres/KV-backed rate limit (replacing the in-memory Map), CORS narrowed, `installId` moved to `expo-crypto randomUUID()` | Gani | P1 | 1d | Quota survives instance restarts; abuse dashboard query documented |
| T2.5 | Tomo prompt-injection hardening (excellence-plan A7): server-side input canonicalization + `coaching_audit` alerting | Ari | P1 | 1.5d | Injection test corpus passes; alerts fire on anomalous prompts |
| T2.6 | Publish a retirement date for the legacy HS256 auth path; add Sentry counter on its use to size the blast radius | Backend | P2 | 0.5d | Usage metric live; deprecation date in backend/CLAUDE.md |

### Track 3 — Monetize & delight (product)

| ID | Task | Product | Pri | Effort | Acceptance |
|----|------|---------|-----|--------|------------|
| T3.1 | **Finish Gani Plus**: RevenueCat SDK in a dev build, products configured in Play Console (+ App Store when iOS lands), `purchasePlus()`/`restorePurchases()` real, sandbox purchase → `SET_PREMIUM` verified | Gani | **P0** | 2–3d (blocked on founder accounts, decision F2) | A sandbox user hits the 25-hint cap, pays, and gets unlimited tutoring |
| T3.2 | Cap Gani tape history (500 entries, pinned exempt) and split it into its own storage key with migration | Gani | P0 | 1d | Cold start unaffected by tape size; migration test |
| T3.3 | Gani precision honesty: render exact integers up to engine precision, group decimals (incl. Indian system), or soften the README/store "32-digit" claim to match `toSignificantDigits(14)` — pick one, do it fully | Gani | P1 | 1d | Display, README, and store listing agree |
| T3.4 | Gani tape UX: expand affordance (chevron), "Use expression" alongside "Use result"; persist main expression + memory like the scratchpad already does; resolve `'system'` theme via `useColorScheme()` | Gani | P1 | 1.5d | Audit §3 mediums closed |
| T3.5 | Ari CSV export (transactions + P&L) — smallest sprint-5 moat item, high retention value for tax season | Ari | P1 | 1d | Export opens correctly in Excel/Sheets with en-IN formatting |
| T3.6 | Proactive Tomo: weekly brief push on existing `/coaching` infra + one anomaly nudge ("food spend 2× this week") | Ari | P2 | 2d | First proactive brief delivered to a real device |
| T3.7 | Aritomo web polish: error/empty/loading states on the dashboard actions shipped last week | Web | P2 | 1d | No silent failures on transaction/budget writes |
| T3.8 | Activate the shipped Razorpay billing stack in **test mode**: create plans, set Railway env vars, register webhook; verify subscribe → webhook → tier upgrade → cancel end-to-end (see §6; in-app paywall stays OFF pending F7) | Backend | P1 | 1d | `/api/billing/status` returns `configured:true`; test-mode subscription lifecycle green |

### Track 4 — Quality gates (make regressions impossible)

| ID | Task | Product | Pri | Effort | Acceptance |
|----|------|---------|-----|--------|------------|
| T4.1 | Run Maestro e2e green on an emulator, then wire into CI (the gate sprint 4 left open) | Ari | P1 | 1d | `npm run e2e` green in CI on every PR |
| T4.2 | Aritomo web CI: typecheck + lint + build on PR; Vercel preview deploys gated on it | Web | P1 | 0.5d | Red PRs can't deploy |
| T4.3 | Gani: regression tests for the three fixed audit bugs if not already pinned; tests for T3.2 migration and T3.3 formatting | Gani | P1 | included above | Each fix has a test that fails on revert |
| T4.4 | Coverage ratchet: Ari floors 57/59/50/58 → 60 across the board | Ari | P2 | ongoing | CI floor raised |

---

## 4. Founder decisions needed (blocking, ordered)

| # | Decision | Blocks | Ask |
|---|----------|--------|-----|
| F1 | Grant org access / push rights to migrate the backend into `pinegrass/ari-backend`, and repoint Railway | T2.1 (P0) | 30 min this week |
| F2 | RevenueCat account + Play Console billing setup for Gani Plus; confirm ₹ price points | T3.1 (P0) | 1 hour |
| F7 | Pick Ari's billing path per §6 (web-first Razorpay vs. Play Billing vs. User Choice Billing) — paywall stays OFF until decided | Ari monetization | 30 min discussion |
| F3 | "Go" on the v1.1.0 Play submission after the device checklist (note: EAS was at 91% of monthly build credits on 2026-07-05 — check before the AAB build, or route through Codemagic) | T1.2 | Same day as T1.1 |
| F4 | Dark palette sign-off (preview artifact from sprint 4) | T1.6 | 15 min |
| F5 | Staging infra click-through (Railway service + Supabase project) | T2.3 | 10 min |
| F6 | iOS launch timing for both apps once TestFlight lanes are green | T1.7 | Decision only |

---

## 5. Exit criteria (sprint review, 2026-07-31)

1. Ari v1.1.0 at 100% Play rollout (or a documented, Sentry-evidenced halt) and the OTA queue empty.
2. Zero production code outside the Pinegrass org; CI + branch protection on all four repos, including the backend.
3. A sandbox user can pay for Gani Plus and receive unlimited tutoring.
4. Sentry symbolicated on both platforms; PostHog funnel live — every launch decision from here is made against real numbers.
5. Backend CORS locked; tutor quota abuse-resistant; staging environment exists.
6. Re-grade both products against the excellence-plan scorecard with CI-verified numbers.

## 6. Payments update (2026-07-16) — Razorpay & Cashfree approved

Both payment-aggregator registrations are approved. What that does and does not unblock:

### What it unblocks now

- **Ari backend billing activation (test → live):** the full Razorpay subscription
  stack is already shipped and dormant (`/api/billing/*`: plan catalog, subscription
  create, HMAC-verified webhook, `subscription_events` audit — see
  `RAZORPAY_INTEGRATION.md`). Setup is: create the 3 plans (₹99/₹129/₹249), set the
  6 Railway env vars, register the webhook. `/api/billing/status` flips
  `configured:true`. **New sprint task T3.8 (P1):** do this in Razorpay test mode and
  verify the webhook → tier-upgrade → cancel flow end-to-end.
- **Web checkout on aritomo.in:** subscriptions sold on the web carry **no Google
  service fee** and no Play-policy constraints. This is the fastest legitimate
  revenue path for Ari and a natural next step for the web dashboard.

### What it does NOT unblock

- **In-app digital subscriptions in the Play builds.** Google Play's payments policy
  requires Google Play Billing for digital goods consumed in-app. Shipping the
  existing `react-native-razorpay` checkout inside the Play build as-is is an
  app-removal risk. In India, Google's **User Choice Billing** program permits an
  alternative billing system (Razorpay qualifies) — but only *alongside* Play
  Billing, with enrollment, and the service fee is only reduced by ~4%, not removed.
- **Gani Plus (T3.1) is unchanged:** it needs Google Play Billing, which is exactly
  what RevenueCat wraps. F2 (RevenueCat + Play Console merchant setup) remains the
  blocking ask.

### Recommended path (decision F7)

1. **Gani Plus:** RevenueCat + Play Billing. Simple, compliant, already 80% wired.
2. **Ari:** web-first — activate Razorpay checkout on aritomo.in (0% Google fee, reuses
   the shipped backend), keep the in-app paywall flag OFF, let the app consume the
   entitlement via the existing `/me` tier field. Evaluate User Choice Billing
   enrollment only if web conversion proves the price points.
3. **Cashfree:** park it as the backup gateway. Do not dual-integrate now — a second
   gateway doubles the webhook/audit/reconciliation surface for zero user value at
   this stage. Its future role: failover, and payouts if group settle-up ever moves
   beyond UPI intents.

## 7. Explicitly out of scope this sprint

Account Aggregator go-live (needs compliance budget + pen test first), SMS autocapture
phase 2, Ari paywall/Razorpay activation, Gani workbench features (Canvas/Sheet/
graphing), multi-currency, and any new product surface. Breadth stops until the
above trust and revenue loops are closed.
