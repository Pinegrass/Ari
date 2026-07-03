# Ari — Product Excellence Plan ("A-grade" Roadmap)

**Author:** CTO (Claude), 2026-07-03
**Goal:** Make Ari the best money-managing app for Indian users — measurably A-grade on UI/UX, system design, security, user flow, and user friendliness.
**Inputs:** `ari-audit-findings-sprint-2.md`, `security-audit-sprint-2.md`, `competitive-gap-study.md`, `sprint-2-backlog.md`, current code state (verified 2026-07-03).

---

## 1. What "A-grade" means (measurable exit criteria)

| Pillar | A-grade definition | Current grade |
|--------|-------------------|---------------|
| Security | Zero open medium+ findings; CI dependency scanning; rate-limited auth; fail-fast secrets | B |
| System design | Zero silent failures; CI gates on both repos; staging before prod; ≥60% coverage on logic layers | B |
| UI/UX | Zero design-debt items; accessibility pass done; consistent design system incl. onboarding | B+ |
| User flow | Log an expense in <5s; edit without delete+re-add; proactive reminders | B |
| Friendliness | Onboarding shows value in <60s; Tomo reaches out, not just answers | B− |

---

## 2. Pillar plans

### Pillar A — Security (close every known gap)

| # | Item | Effort | Ships as | Why |
|---|------|--------|----------|-----|
| A1 | Rate-limit `/auth/login`, `/auth/register` (per-IP + per-email, Flask-Limiter or reuse `jobs/rate_limiter.py`) | S | Backend deploy | Verified absent today; brute-force exposure |
| A2 | `SECRET_KEY` fail-fast: refuse to boot in prod with `dev-secret-change-me` | S | Backend deploy | Verified still defaulted in `config.py` |
| A3 | CI dependency scanning: `npm audit` + `pip-audit` + Dependabot on both repos | S | CI only | Audit long-term rec; automate it now |
| A4 | Privacy policy: enumerate Supabase/PostHog/Sentry/Google per audit Finding 1 | S | Legal page (backend `/legal/*`) | iOS launch prerequisite |
| A5 | Supabase prod hygiene: remove test accounts, re-verify RLS after any schema change | S | Ops | Audit medium-term rec |
| A6 | SSL certificate pinning (expo config plugin) | M | **v1.1.0 native build** | Audit backlog item; bundle with next native build |
| A7 | Tomo prompt-injection hardening: server-side input canonicalization + `coaching_audit` alerting | M | Backend deploy | Memory: backend-hardening backlog |
| A8 | Formal pen test | L | Before AA integration | Gate for bank-data features |

### Pillar B — System design (trustworthy by construction)

| # | Item | Effort | Why |
|---|------|--------|-----|
| B1 | Fix `addTransaction` silent error swallow — surface failures to the user, queue for retry | S | Known from device QA; silent data loss is the worst failure mode a finance app can have |
| B2 | **Edit transaction** end-to-end (backend `PUT /transactions/:id`, DataContext `updateTransaction`, edit mode in AddTransactionScreen, row affordance) | M | Backlog #1; delete+re-add is both a UX insult and a data-integrity smell |
| B3 | GitHub Actions CI on both repos: typecheck + lint + test + coverage gate | S | Yesterday's audit self-reported "426 tests pass" when the suite has 256 — human checklists lie; CI doesn't |
| B4 | Backend pytest suite for auth, transactions, budgets routes (target: every route touched by money has a test) | M | Backend currently relies on manual smoke tests |
| B5 | Staging gate for Railway: staging service on a `staging` branch; prod deploys become explicit promotions | M | Auto-deploy-to-prod on push is a standing incident risk |
| B6 | Sync engine hardening: raise `syncEngine.ts` coverage (47% → 70%+), document conflict policy, add sync-failure telemetry | M | Offline-first is our positioning; it must be bulletproof |
| B7 | Observability: enable PostHog (set key), Sentry release health dashboards, Railway alerting | S | Can't manage what we can't see; analytics is currently a no-op |
| B8 | Coverage ratchet continues: 42/50/36/43 today → 60% floor on `utils`/`lib`/`api` by Sprint 4 | S | Already in motion (tax calculator done today) |

### Pillar C — UI/UX (zero debt, consistent, accessible)

| # | Item | Effort | Why |
|---|------|--------|-----|
| C1 | Onboarding reskin: remove `LinearGradient` (last design-debt item), align with forest design system | S | Verified still present today |
| C2 | Accessibility pass: `accessibilityLabel` on all touchables, ≥44pt targets, font-scaling audit, contrast check on dark palette | M | Table stakes for App Store featuring; currently unaudited |
| C3 | Skeleton loaders replacing spinners on Dashboard/Trends; audited empty states everywhere | S | Perceived performance = UX grade |
| C4 | Theme toggle (system/dark/light) — gap #15 | S | Low effort; removes a 1-star-review magnet |
| C5 | Maestro e2e smoke flows for the 5 tabs + add/edit/delete transaction | M | Screens are exempt from unit coverage by design; e2e is their gate |
| C6 | Haptics + animation consistency sweep (AnimatedEntry everywhere lists render) | S | Polish that separates A from B+ |

### Pillar D — User flow & friendliness (fastest tracker in India)

| # | Item | Effort | Ships as | Why |
|---|------|--------|----------|-----|
| D1 | Bill / due-date reminders (rent, EMI, credit card) on existing push infra | S | OTA | Gap study "build next" #1 — highest value/effort ratio |
| D2 | Recurring-transaction surfacing: "upcoming charges" card from existing `recurringEngine` | M | OTA | Gap study "build next" #3; engine already exists |
| D3 | Smart settle-up: UPI intent deep link from group balances | M | OTA | Gap study "build next" #2; India-first differentiator |
| D4 | Onboarding revamp: value-first (show a demo dashboard before signup), <60s to first logged expense | M | OTA | First-session retention is the whole game |
| D5 | CSV export (transactions + P&L) | S | OTA | Tax-filing support; power-user retention |
| D6 | Home-screen widgets ("spent today", budget ring) | M | **v1.1.0 native build** | Gap #13; App Store screenshot story |
| D7 | Tomo goes proactive: weekly brief push + anomaly nudges ("food spend 2× this week") on existing `/coaching` infra | M | OTA | No competitor has a coach that reaches out; this is our moat |

### Pillar E — Category leadership (post-PMF, founder-gated)

- Savings envelopes / zero-based budgeting (YNAB's moat, adapted for India)
- Account Aggregator integration (already scaffolded behind `SETU_ENABLED`; needs compliance budget)
- SMS autocapture Phase 2 (notification-listener approach to avoid READ_SMS Play risk)
- Multi-currency for freelancers; web companion

---

## 3. Sequencing

### Sprint 0 — "Close the audit" (this week, no native build)
A1, A2, A3, B1, B3, C1, B7-part (PostHog key + Sentry dashboards)
**Exit:** zero known medium+ security findings; CI green as the only source of truth; no silent failures on the money write path.

### Sprint 3 — "Feel the speed" (2 weeks, OTA)
B2 (edit transaction), D1 (bill reminders), D4 (onboarding), C3, C4, C6, B4
**Exit:** edit works; reminders live; onboarding <60s; theme toggle shipped.

### Sprint 4 — "v1.1.0 native" (2 weeks)
A6 (pinning), D6 (widgets), D2, D3, C2, C5, B5, B6, share-import GA
**Exit:** native build v1.1.0 to Play + TestFlight; accessibility pass done; staging gate live.

### Sprint 5 — "The moat" (2–3 weeks)
D7 (proactive Tomo), D5 (CSV), B8 (coverage 60%), A7
**Exit:** Tomo sends its first proactive weekly brief; A-grade scorecard re-audit.

---

## 4. Founder-only decisions (blocking, need Rex)

1. **iOS launch timing** — TestFlight requires a macOS build (`expo prebuild -p ios`); who/when?
2. **Monetization** — paywall stays flag-gated off through Sprint 5, or do envelopes/AA land behind Pro?
3. **AA compliance budget** — Setu/AA integration is scaffolded but needs a compliance/ops decision before any real bank data flows.

## 5. Scorecard cadence

Re-grade all five pillars at each sprint exit against §1. The audit that graded us B/B+ gets re-run (with CI-verified numbers, not checklist claims) at Sprint 4 exit — target: straight A's.
