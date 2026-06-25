# Ari — Plan: Auto Transaction Capture + OTA Strategy

> **Date:** 2026-06-02
> **Author:** CTO / product-architect review (planning only — no code modified)
> **Companion:** `audit-report-2026-06-02.md`

---

## Part A — Auto Transaction Capture ("AutoCapture")

### A.0 The reality that frames everything: Google Play's SMS policy

Since 2019, `READ_SMS` / `RECEIVE_SMS` are **restricted permissions**. Default eligibility is essentially "be the default SMS/dialer app." A narrow exception path for financial-transaction tracking exists via the **Permissions Declaration Form** + video demo + manual review (Indian apps like Walnut/Money View have used it), but it is discretionary, periodically re-reviewed, a frequent suspension trigger, and continually tightened. **An app that loses SMS access mid-life loses its core feature overnight.** A brand-new listing should not depend on it.

Every recommendation below is organized around *not* making SMS the load-bearing wall.

### A.1 — MVP or Phase 2?

**Phase 2** — but ship a *policy-safe slice* sooner. Friction reduction is the strongest retention lever, but the highest-acquisition-friction source (SMS) is also the highest-risk. **Decouple them.**

### A.2 — Best technical route for Android (ranked)

| Rank | Route | Permission / cost | Verdict |
|------|-------|-------------------|---------|
| 1 | **Share-to-Ari / manual forward** (share sheet → parse) | none | ✅ Ship now. Zero Play risk. Works on Expo today. The wedge. |
| 2 | **Statement import (PDF/CSV)** | none | ✅ High value for freelancers/MSME; enables backfill. |
| 3 | **Notification Listener** (`BIND_NOTIFICATION_LISTENER_SERVICE`) | sensitive; needs custom native module + dev build + prominent disclosure | ⚠️ Phase 2 power feature; notification text often truncated. |
| 4 | **Account Aggregator (AA) framework** (Setu/Finvu/OneMoney) | RBI-sanctioned consent; needs FIU status or TSP partner | ⭐ Strategic Phase 3 endgame — clean, legal, structured. |
| 5 | **Email parsing (Gmail API read-only)** | restricted scope → Google CASA assessment (annual, paid) | Heavy; only if email receipts prove high-value. |
| 6 | **`READ_SMS`** | restricted; Permissions Declaration | Last resort; bonus accelerant, never foundation. |
| ✗ | **Accessibility service** | — | ❌ **Never.** Explicit policy violation → near-certain suspension. |

### A.3 — Play Store risk levels

SMS = **highest** (suspension / forced feature removal). Notification listener = **medium** (disclosure + review). Accessibility = **fatal**. Email = **medium** (CASA cost/time). Share / import / AA = **negligible**. All sensitive sources require an in-app **prominent disclosure** screen *before* the system prompt + a matching Play Data Safety section.

### A.4 — Safest privacy-first architecture

- **On-device parse first** for known formats; never upload raw messages by default.
- **Never persist full SMS/notification body server-side.** Store only extracted fields + a `dedup_hash`. If raw is needed for "report bad parse," keep it on-device, encrypted, TTL-expired (~7 days).
- **Mask account numbers to last-4**, drop OTP messages by sender/keyword pattern, redact card PANs (reuse `backend/routes/parse.py` scrubbing).
- **Opt-in per source**, one-tap disable that purges the staging table, full review/edit/delete.
- Encrypt the staging store at rest (SQLCipher on-device / encrypted column server-side).

### A.5 — Extraction pipeline

```
Raw alert
  → sender allowlist + OTP/promo filter (drop non-financial)
  → on-device regex/template bank-format matcher (HDFC, SBI, ICICI, GPay, PhonePe, Paytm…)
  → [if no match] PII-scrub → backend Gemini parse  (/parse/expense ALREADY EXISTS)
  → normalized txn {amount, direction, merchant, datetime, mode, bank_hint, balance?, confidence}
  → dedup check (see A.7)
  → category suggestion (autoDetectCategory + learned overrides)
  → staging table, status=pending
  → "Review N new" inbox → user confirm/edit
  → promoted to transactions table; correction feeds the category learner
```

> **Key leverage:** the hard part is already shipped — `/parse/expense` does schema-enforced Gemini parsing with PII scrubbing. AutoCapture is largely plumbing new sources into an existing engine.

### A.6 — On-device / backend / hybrid?

**Hybrid.** Template-match common Indian formats on-device (fast, free, private — covers the high-volume 80%); fall back to backend Gemini only for unrecognized formats, sending scrubbed text. Minimizes cost, latency, and data egress at once.

### A.7 — Deduplication (the genuinely hard problem)

- **Composite fuzzy key:** `amount` + `direction` + `date within ±minutes` + `account last-4` + normalized merchant.
- **Source priority** for the same txn across channels: `bank statement > SMS > notification > email`. Higher-authority source supersedes/enriches the lower one (merge, don't duplicate).
- Store a `dedup_hash`; on collision → merge missing fields, don't insert.
- Statement import must reconcile against already-captured rows in its date range, not blindly append.

### A.8 — Database schema (staging, separate from confirmed `transactions`)

```
captured_transaction
  id, user_id
  source            enum(sms|notification|email|statement|share)
  status            enum(pending|confirmed|dismissed|duplicate)
  amount            int
  direction         enum(debit|credit)
  merchant_raw, merchant_normalized
  occurred_at       timestamp
  payment_mode      enum(upi|card|netbanking|atm|cash|other) null
  account_hint      varchar   -- last-4 ONLY, masked
  balance_after     int null
  suggested_category, confidence float
  dedup_hash        varchar (indexed)
  linked_txn_id     fk -> transactions.id null
  raw_ref           varchar null  -- on-device pointer/TTL, NOT the body
  created_at
-- NO full message body column on the server.

capture_rule        -- learned merchant→category + sender allowlist
capture_settings    -- per-source enabled flags
```

### A.9 — Edge cases & handling

| Case | Handling |
|------|----------|
| Failed UPI | "failed/declined" keyword → drop, never create expense |
| Reversed / refund | credit referencing a prior debit → link & net, don't double-count |
| Credit-card bill payment | bank debit + card credit = internal transfer, **not** an expense |
| Internal transfers (own accounts) | flag as transfer, exclude from spend |
| ATM withdrawal | debit but cash-out, not categorized spend → "cash withdrawal" |
| Cash deposit | credit but not income → mark accordingly |
| Ambiguous merchant ("POS 123456") | low confidence → force review, never auto-confirm |
| Split / partial payments | keep separate; dedup must not merge partial with full |
| Same txn across channels | A.7 dedup |
| Promo / EMI / low-balance / OTP | filter at sender/keyword stage |

**Default stance:** low-confidence → review queue, never silent auto-add. One wrong auto-expense and the user disables the feature.

### A.10 — UX flow

```
Enable AutoCapture
  → Disclosure screen (plain-language: what we read / what we never store + privacy promises)
  → Permission grant
  → Background capture
  → "Review N new transactions" badge  (no silent writes early on)
  → User confirm / edit / recategorize
  → Learner improves suggestions
  → (user-controlled) graduate trusted patterns to auto-confirm
Always available: review, edit, delete, disable, purge.
```

### A.11 — Naming

Ship the feature labelled **"AutoCapture"** (clarity wins for a first-time Indian finance user). Keep **"Money Lens"** in reserve as an umbrella brand if it expands across SMS + email + statements. **Avoid "Expense Autopilot"** — "autopilot" overpromises the automation you explicitly should *not* give early.

### A.12 — Final recommendation

- **Build later (Phase 2), but ship the safe wedge now.**
- **Best path:** v1 = *Share-to-Ari + statement import + hybrid parse* (reuses `/parse/expense`, zero Play risk, mostly OTA-shippable once OTA works) → v1.5 = *notification listener* (native build + disclosure) → v2 = *SMS via Permissions Declaration + AA framework* (structural endgame).
- **Risk:** share/import = LOW; notification = MEDIUM; SMS = HIGH (listing risk); accessibility = DO NOT.
- **MVP version:** manual share + statement upload + review inbox + dedup + category learning.
- **Full version:** multi-source auto-capture, auto-confirm for trusted patterns, full reconciliation.
- **What NOT to do:** ❌ accessibility service · ❌ SMS in MVP · ❌ silent auto-add of low-confidence txns · ❌ storing raw message bodies server-side · ❌ shipping any of this while OTA is still dead.

---

## Part B — OTA Update Strategy

### B.0 Current state: broken-by-omission

`expo-updates` is installed and the EAS channel is wired (`app.json` `updates.url` + `runtimeVersion: appVersion`; `eas.json` production→production channel), but **nothing in `src/` ever calls `checkForUpdateAsync()` / `reloadAsync()`**. Published updates never load. Fixing this is the cheapest, highest-leverage post-launch move.

### B.1 What OTA *can* ship (runtimeVersion policy = `appVersion`, pinned to 1.0.0)

Any pure-JS/TS change: styles, images/assets, copy, business logic, **the entire AutoCapture share/import/parse UI + logic**, and the audit's OTA-fixable bugs (`Promise.all` spinner, delete-rollback, prompt copy).

### B.2 What requires a new native build (+ runtimeVersion bump)

Anything touching native modules: the notification-listener module, any SMS module, new Expo native deps, permission additions in `app.json`, New-Arch changes, Razorpay re-link.

### B.3 Recommended setup

1. **Cold-start update check** (and optionally on resume): `checkForUpdateAsync` → `fetchUpdateAsync` → apply on next launch. Don't block the splash on the network — fetch in background.
2. **Guard against bricking:** treat a fetch failure as a no-op (keep current bundle); rely on expo-updates' automatic rollback to the embedded bundle if a new update crashes on launch. Add a Sentry breadcrumb on update apply to correlate crash spikes to a specific OTA.
3. **Keep `runtimeVersion: appVersion`** — it correctly blocks JS that assumes native code the installed build lacks. Bump app `version` whenever native deps/permissions change; only `eas update` JS-compatible changes to a given runtime.
4. **Process:** fix forward via `eas update --branch production`; for a bad push, re-publish the last-good commit to the channel (document in `RELEASE.md` once the check code exists).
5. The update-check code itself must land in a **store build** first (it's JS, but needs to be embedded). The very next build should include it — after that you're in OTA-hotfix territory for all JS.

---

## Part C — Suggested sequencing (combined)

1. **Next store build (native):** OTA update-check code + remove `SECRET_KEY` default + `debug=False`.
2. **First OTA hotfix (JS):** `Promise.all` spinner fix, delete-rollback fix, Tomo prompt hardening.
3. **Backend deploy:** per-user rate limiting on Gemini endpoints, amount bounds.
4. **AutoCapture v1 (mostly OTA):** Share-to-Ari + statement import on top of `/parse/expense`, with staging schema + review inbox.
5. **Phase 2:** notification listener (native build) → SMS-declaration / AA framework evaluation.

---

*End of plan. Companion document: `audit-report-2026-06-02.md`.*
