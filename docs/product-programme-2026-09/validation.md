# Programme validation — 11 September 2026

This record belongs to the local product programme, not the separate release-verification task. No production migration, deployment, store build, purchase or customer-data mutation was performed here.

## Automated checks

| Surface | Check | Result |
|---|---|---|
| Mobile | `npm run lint` | Pass after fixing a named test mock |
| Mobile | `npm run typecheck` | Pass |
| Mobile | `npm test -- --runInBand` | Final rerun: 40 suites / 497 tests passed, including privacy hydration, metadata filtering and Hindi bill-preview assertion |
| Backend | `.venv/Scripts/python.exe -m pytest -q` | Final rerun: 264 passed, including the extra inbox isolation/dismissal test |
| Backend | Ruff `--select F,E9` on changed report/nudge/coaching/Tomo modules and tests | Pass; repository CI has no configured broad style gate |
| Web | `npm run lint` | Pass |
| Web | `npm run typecheck` and production build TypeScript stage | Pass |
| Web | `npm test` | 2 files / 7 tests passed |
| Web | `npm run build` | Pass; all 14 static generation steps, no synthetic QA route in final route list |

Full-suite mobile coverage includes local outbox/reconciliation, offline cache, account-scoped data context, notification routing/dismissal, recurring/bill calculations and revenue/locale regressions. Tests use mocks/synthetic data; they do not establish physical notification delivery, live sync or payment success. New tests cover period/leap boundaries, Decimal deficits, input 400s, report ownership, Hindi evidence, category deltas, preferences, opt-out behavior, preview minimisation, dedupe, uncertain delivery, report masking and catalog parity.

Failures found and corrected: invalid test income category; missing Windows timezone data (`tzdata` dependency added); initial report-test startup exceeded Jest's default timeout; test mock display-name lint error; Next static-export metadata routes required `dynamic='force-static'`. These were rerun successfully. Initial temporary underscore-prefixed QA route was a Next private folder and returned 404; it was renamed for verification and subsequently removed.

## Isolated PostgreSQL migration

Used an existing `postgres:16-alpine` Docker image in a disposable named container with `--network none`, no published port and no production volume. Seeded only a synthetic user and client roles. Executed `supabase/migrations/20260911130428_notification_policy.sql` twice through `tests/notification_policy_schema.sql`.

Passed table creation/idempotent application, both RLS flags, denied anon/authenticated table privileges, unique user/event rejection and cascading deletion of preferences/deliveries. Container stopped and automatically removed afterward. This does not validate the full production Supabase schema, runtime role grants, deployment timing, backups or concurrent delivery races under load. Migration must still be exercised on isolated staging before release. No remote DB was changed.

## Browser verification

- Public `https://www.aritomo.in`: observed homepage and sign-in path. Existing authenticated session later exposed the app; inspected live Reports read-only. Observed confusing legacy trend labels and missing-income interpretation. Did not copy user amounts or screenshots into artifacts, add records, submit chat or change settings.
- Local Next homepage: visually inspected English at 1440×1000 and phone layout at 390×844; Hindi phone layout at 390×844. Language switch persisted across navigation. DOM width check reported no horizontal overflow. Local console error query returned none during inspected final homepage/report flows.
- Synthetic report fixture using the real `MoneyReview` component: mature recorded history with a negative USD total, empty history, missing baseline, failure/retry, recovery, English/Hindi switching and phone layout. Verified the negative sign and disclosed data limits. This fixture supplied data locally and did not test a live browser-to-backend report request. Backend endpoint contract was tested separately.
- Removed the temporary `app/qa-review/page.tsx` and directory before successful production build. No test data or bypass route is shipped.
- After restarting the development server for handoff, a host HTTP request returned 200 but the integrated browser's reopen attempt encountered a connection-error page blocked by its data-URL policy. The earlier visual checks above completed successfully; a reopened preview is not claimed. Local server command: `npm run dev -- --hostname 127.0.0.1 --port 3100`.

## Not yet verified

Physical Android/iOS layouts, Devanagari font scaling/screen readers, actual push receipts, OS preference changes, local/server reminder interaction, live backend deployment of the schema/API, full staged browser API flow, offline/reconnect UI on physical devices, production backups/restoration/deletion, real billing/renewal, broad Hindi copy completeness and human linguistic review. A real first-time signup was not created; empty-user behavior was synthetic. Existing authenticated production account was not used for mutation tests. No Core Web Vitals/Lighthouse score is claimed.

The concurrent release task owns its separate physical/provider evidence and exact artifacts. Its verified release source excludes this programme's uncommitted edits. Before release, record three new commits and follow the staging/contract sequence in [the programme report](README.md).

## Phase 2 final checks — 11 September 2026

See [phase-2.md](phase-2.md) for scope and limitations. The following supersede phase-1 local test counts, not the separate release-task evidence:

| Check | Result |
| --- | --- |
| Mobile Jest, full suite | 41 suites / 500 tests passed |
| Mobile typecheck and Expo lint | Passed |
| Backend pytest, full suite | 272 tests passed |
| Backend Ruff F/E9 on changed receipt/model/route/test files | Passed |
| Web Vitest | 3 files / 9 tests passed |
| Web typecheck and ESLint | Passed |
| Web production static build | Passed, 14 generation steps; no temporary QA route |
| PostgreSQL 16 notification + receipt migrations | Both applied twice; columns/index/RLS/privileges/uniqueness/cascade passed |
| Tracked diff whitespace checks, all three repositories | Passed; Git emitted normal CRLF normalization notices |

The disposable PostgreSQL container was stopped and removed. New receipt tests mock Expo; no live delivery is claimed. New mobile inbox interactions are component tests, not physical-device tests. Web inbox tests verify API contracts, not browser interactions. No phase-2 browser visual verification was performed. The local development server was stopped before the successful build. Changes remain local and uncommitted; commercial configuration and releases were unchanged by this phase.

## Phase 3 final checks — 11 September 2026

Backend full suite: **284 passed**. Scoped Ruff F/E9 and tracked diff checks passed. All three notification migrations applied twice in isolated PostgreSQL 16 with schema/index/RLS/client-denial/uniqueness/cascade checks. Two overlapping application workers in a synthetic PostgreSQL database made one mocked provider call and respected the per-user quota. Disposable container stopped/removed. Details and reproducible script: [phase-3.md](phase-3.md). Mobile/web source unchanged; phase-2 checks were not rerun and remain historical evidence. No live notification, staging deployment or device evidence is claimed.
