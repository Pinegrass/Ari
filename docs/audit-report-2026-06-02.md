# Ari — Post-Launch Codebase Audit Report

> **Date:** 2026-06-02
> **Author:** CTO review (read-only audit — no code modified, moved, or run)
> **Scope:** Frontend (Expo/React Native), Backend (Flask), Release/OTA/config integrity
> **Context:** App launched to Google Play Store 2026-05-31. This is the baseline audit for continuous monitoring.

---

## 0. Headline

Three things, in priority order:

1. **OTA is configured but the app never checks for updates.** Published `eas update`s are silently ignored. Your only patch path today is a full Play Store release. (See the companion plan: `plan-autocapture-ota-2026-06-02.md`.)
2. **A handful of real backend hardening items** — `SECRET_KEY` default, AI prompt-injection surface, no rate limiting on Gemini endpoints. None on fire; all are future-incident material once volume grows.
3. **The v1 build is fundamentally well-made** — clean ORM (no SQLi), consistent IDOR checks, secure token storage, PII scrubbing already present, Sentry + ErrorBoundary wired.

> **Verification note:** Findings below were produced by parallel audit agents and the load-bearing ones were re-verified by hand. Two raw findings were corrected after verification (see §5).

---

## 1. CRITICAL / HIGH — act before next release

| # | Finding | Where | Why it matters |
|---|---------|-------|----------------|
| 1 | **OTA updates non-functional** | no `Updates.*` calls in `src/` (grep: 0 matches) | Published OTA updates are silently ignored. No hotfix path without a store release. |
| 2 | **`SECRET_KEY` falls back to `"dev-secret-change-me"`** | `backend/config.py:8`, used by `backend/auth_helpers.py:24,30` | Legacy HS256 auth path is still live (`token_required` → `decode_token`). If Railway is missing `SECRET_KEY`, anyone can forge a token for any known user UUID → **full auth bypass**. **Action:** confirm `SECRET_KEY` is set in Railway, then delete the default and fail loudly on startup. |
| 3 | **Gemini prompt-injection surface** | `backend/routes/tomo.py` — `SYSTEM_PROMPT.format(context=...)` | User-controlled text (transaction descriptions, custom category names) is interpolated into the *system* prompt. A crafted description can hijack Tomo. Move user data into a clearly-delimited, non-authoritative section and instruct the model to treat it as data only. |
| 4 | **No rate limiting on Gemini endpoints** | `backend/routes/tomo.py`, `backend/routes/parse.py` | A buggy/malicious client can hammer `/tomo/chat` and `/parse/expense` and run up a real Gemini bill / DoS. Daily budget cap is process-level (×2 workers), not per-user. Add per-user limits (e.g. 10/min chat, 20/min parse → HTTP 429). |
| 5 | **CORS defaults to `*`** | `backend/config.py:11`, `backend/app.py:45` | Fine for a pure-mobile token API, but `*` + any future cookie/credential use is a CSRF footgun. Set explicit origins or assert `allow_credentials=False`. |
| 6 | **`.env` committed to git history** | repo root `.env` | Supabase anon key + Sentry DSN + API URL are in history despite `.gitignore`. Anon key is bundle-public anyway, but scrub history and rotate to be clean. Also add `*.aab`/`*.apk` to `.gitignore` (a 62 MB `ari-production-1.0.0-2.aab` is sitting untracked). |

---

## 2. MEDIUM — reliability / correctness

- **`Promise.all` with no `.catch` in DataContext** (`src/context/DataContext.tsx` — `fetchAll`/`refresh`): if any single fetch rejects, the loading flag never clears → **infinite spinner** on transient network failure. Use `Promise.allSettled` or per-fetch try/catch. (OTA-fixable.)
- **Optimistic-delete rollback stored on a function property** (`(deleteTransaction as any).__rollback`): two rapid deletes clobber each other's rollback state → wrong list restored on failure. Use local state/closure. (OTA-fixable.)
- **No amount upper bound + float truncation** (`backend/routes/transactions.py`): `int(amount)` silently truncates `1.99`; no max. Enforce `0 < amount <= <cap>` and reject >2-decimal inputs.
- **No "selected month" abstraction**: DataContext always fetches `getCurrentMonth()`, so cross-screen month state can desync (Dashboard shows current month, Budget planner shows the navigated month).
- **`token_required` makes a synchronous 10s `httpx` call to Supabase on every locally-undecodable token** (`backend/auth_helpers.py:170,178`): a latency/DoS amplifier under load or if Supabase is slow. Cache verification results briefly.

---

## 3. LOW — cleanup

- `debug=True` in the `__main__` block (`backend/app.py:99`) — harmless under Gunicorn, but set it false so a stray `py app.py` in the wrong env can't expose the debugger.
- `setUserContext()` defined but never called (`src/config/sentry.ts`) — Sentry crashes aren't tied to users; only PostHog is. One line in AuthContext fixes attribution.
- 6-char minimum password (`backend/routes/auth.py:42`) — Supabase enforces its own rules anyway; align to ≥8–12.
- **Doc drift** — `CLAUDE.md` describes a stack that no longer matches reality (see §6).

---

## 4. What's genuinely solid ✅

- No SQL injection — clean SQLAlchemy ORM throughout.
- IDOR checks present and consistent across transactions / budgets / goals / todos.
- Secure token storage via `expo-secure-store` with legacy AsyncStorage migration.
- PII scrubbing already implemented in `backend/routes/parse.py` (card PANs, OTP, passwords).
- Sentry + root `ErrorBoundary` wired; analytics no-op safely when key absent.
- Razorpay correctly de-linked for New Architecture (`react-native.config.js`), paywall flag-gated off.

This is a well-built v1.

---

## 5. Corrections made during verification

| Raw audit claim | Correction |
|-----------------|------------|
| `debug=True` is a HIGH production risk | It's inside `if __name__ == "__main__"` (`app.py:98`). Gunicorn imports `app` on line 96 and never runs that block → **not live in prod**. Downgraded to LOW. |
| "OTA may be partially working" | Confirmed fully dead — zero `Updates.*` references in `src/`. |
| SECRET_KEY default is theoretical | Confirmed the legacy HS256 path is still active in `token_required`, so the default genuinely matters. |

---

## 6. Stack drift vs `CLAUDE.md`

`CLAUDE.md` claims "JWT+bcrypt auth, exclusively Gemini, no Razorpay, no Supabase." Reality per `package.json` + code:

- **Auth is Supabase** (ES256 via JWKS) with a still-live legacy HS256 fallback; bcrypt is gone (Supabase owns the hash).
- **Google Sign-In** wired (`@react-native-google-signin`, `google-services.json` present).
- **Installed & active:** `@supabase/supabase-js`, `expo-speech-recognition` (voice expense entry).
- **Installed, intentionally off in v1:** `posthog-react-native` (key unset → no-op), `react-native-razorpay` (flag-gated, New-Arch incompatible).
- **Extra backend routes** beyond CLAUDE.md: `parse.py` (AI expense parse), `groups.py` (shared/split expenses), `billing.py` (Razorpay).

**Recommendation:** refresh `CLAUDE.md`. Trust code over docs until then.

---

## 7. Suggested remediation sequence

1. **Next store build (native):** add OTA update-check code + remove `SECRET_KEY` default + set `debug=False`. Unlocks OTA for everything after.
2. **First OTA hotfix (JS):** `Promise.all` spinner fix, delete-rollback fix, Tomo prompt-injection hardening copy.
3. **Backend deploy:** per-user rate limiting on Gemini endpoints, amount bounds, brief Supabase verification cache.
4. **Hygiene:** scrub `.env` from git history, rotate keys, `.gitignore` build artifacts, refresh `CLAUDE.md`.

---

*End of audit report. Companion document: `plan-autocapture-ota-2026-06-02.md`.*
