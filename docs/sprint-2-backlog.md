# Sprint 2 — Backlog

> Candidate items for Sprint 2 planning. Surfaced during Sprint 1 (P1 native build,
> versionCode 4 / v1.0.1) but explicitly **out of Sprint 1 scope**. Priorities are
> TBD — Rex assesses during Sprint 2 planning. This file is a capture list, not a
> commitment.

---

## 1. PRODUCT GAP: Edit transaction feature — ✅ SHIPPED

- **Status (updated 2026-07-04, Sprint 3):** DONE. `PUT /transactions/:id`
  (`backend/routes/transactions.py:219`), `updateTransaction` in
  `src/api/transactions.ts` + `src/context/DataContext.tsx`, `AddTransactionScreen`
  edit mode, and row-tap edit affordances on Dashboard + Transactions all exist and
  ship. Backend pytest coverage for the PUT path added in Sprint 3 (Task 4).
- **Source:** Sprint 1 Phase 3A smoke feedback (codebase audit revealed the feature
  does not exist when the 3A checklist asked to "edit a transaction").
- **Description:** Users currently must **delete and re-add** to change a saved
  transaction (amount, category, date, description). There is no edit affordance
  anywhere in the app, and no backend support.
- **Confirmed absent (Sprint 1 audit):**
  - No `updateTransaction` in `src/api/transactions.ts` (no PUT/PATCH to
    `/transactions/:id`).
  - No update method in `src/context/DataContext.tsx` (only add + delete).
  - `AddTransactionScreen` is create-only (reads only `route.params?.type`).
  - No backend `PUT /transactions/:id` endpoint.
- **Estimated scope:** backend `PUT /transactions/:id` endpoint + context
  `updateTransaction` method + `AddTransactionScreen` edit mode (prefill from an
  existing transaction) + an edit affordance on `TransactionItem` (e.g. row tap or
  an edit icon).
- **Priority:** TBD (Rex will assess in Sprint 2 planning).

---

## 5. Auth fix already implemented (parallel agent session, overnight 2026-06-10/11)

- **What:** `/auth/me` refresh-on-401 fix in `src/api/client.ts` (introduces
  `shouldRefreshAfter401(path)` so only `/auth/login` and `/auth/register` skip the
  token refresh; `/auth/me` and other protected auth routes now refresh-and-retry on
  401) + a regression test in `src/api/__tests__/client.test.ts`.
- **Origin:** Rex's parallel agent session; verified there — tests pass, typecheck
  passes. Legitimate, well-tested, but **outside Sprint 1 scope**.
- **Current state:** ✅ **SHIPPED in Sprint 1** — committed `31bf571` and built natively
  into **vc5** (`ari-v1.0.1-vc5-production-2026-06-11.aab`), which shipped to Play
  Production. No longer a backlog item; retained here only as historical record.
  (Decision: integrated natively into vc5 rather than shipped as the first OTA hotfix.)
- **Priority:** N/A — DONE.
