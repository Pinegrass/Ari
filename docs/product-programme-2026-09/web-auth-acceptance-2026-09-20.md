# Web and authentication acceptance — 20 September 2026

Owner supplied the registered address and phone number and authorized Supabase sign-in and remaining completion work. Existing physical-device hold, notification rollout gates and provider/pilot acceptance limits persist.

## Completed authentication configuration

Signed into the existing Pinegrass Supabase organization through its existing GitHub session. In Ari project `cazigdaoqeoqnqwajibf`, enabled **Prevent use of leaked passwords**, saved it, then revisited Attack Protection and verified ENABLED. Security advisor no longer reports disabled leaked-password protection. Existing caller-restricted membership helper warning and intentional server-only RLS-without-policy information remain. No paid upgrade or other authentication settings changed.

## Live browser findings and corrections

English/Hindi terms, privacy and support now use the owner-provided address and phone, with native email and telephone links. Source `6b10f306f9719187430fdc637992d6e497aa424e` was built, inspected and promoted to aritomo.in as `dpl_CLbH1uVHrvmgWP6Yd5DhevQyYyLB`. Human legal/linguistic review is not certified by publication or tests.

Authenticated acceptance uses one newly created synthetic account, with credentials protected outside Git. Findings:

- Quick add rejected 12.34 through native HTML step validation. Source `09071835a4cef5f0ce63b496ca28201d8fc8c345` fixes decimal steps across transaction, budget, savings and tax money inputs.
- Reports returned HTTP 500 for populated PostgreSQL data in both languages. Backend `2c088191fb982abbf5b623bdbc8949c8cc1d109c` normalizes UUID IDs before URL quoting and provenance/candidate hashing. Equivalent UUID/string regression and full 633 tests pass.
- Hindi settings retained English copy and an unconditional claim that Razorpay checkout was active. Corrections are being verified before the final web release.
- Backend `d25f1581457464da3e2f2fdc04d708bd0ff5c9ab` adds default-off server `NUDGE_OUTBOX_ENABLED` protection to the authenticated manual endpoint. Tests verify queued rows remain unchanged and worker/provider calls are not made. Railway value explicitly false; daily sending remains disabled.

Already observed in the browser: successful email sign-in and empty-account state; integer capture; confirmed 1000.10 cash minus 100 reserve minus 200 obligation yields 700.10 remainder / 70.01 per day; persisted Hindi planning display; planning-input deletion; optional measurement off → on → off; approved no-card trial activates until 2026-10-04. Later deployed regression and fixture-cleanup results follow below.

No devices, actual push delivery, purchase, AI generation, outreach or existing user data were used for these checks. Full programme acceptance remains open.

## Deployed regression evidence

Backend `b322ac6fb982e05d31a6bac6f1684efa3836c05f` is live on Railway `0f667a7a-bdad-446b-af26-2d32513daf68`. Exact health is healthy; 635 local tests and GitHub CI35526770629 pass. Read-only readiness35526838406 passes. Both daily/outbox server variables are explicitly false. No further migration was necessary.

Report fixture GETs now return 200 in English/Hindi. In the live browser, 12.34 and 0.01 save correctly; with the earlier12 entry, weekly Hindi and monthly English reports show24.35. Report provenance exposes all three correct source entries. Editing12.34 to13.34 through its correction form recalculates the report to25.35. The report retains explicit unknown-bank-balance and inadequate-history caveats. Planning deletion removes the confirmed outlook.

Settings translations and honest checkout availability are released in web `bf9d0d154d153732aa96d1dade01ea43836f3966`, deployment `dpl_DwZrsCuzSB5fXxBiPcabKm49Uaoi`; this is an intermediate artifact before the reload fix. English and Hindi public terms both render the exact address and working telephone href.

A full-page reload then stayed on the loading screen while a fresh email login recovered. Source inspection found a new Supabase Auth client created for every session/API lookup, sharing the same persistence lock. A single browser client plus bounded loading/retry and stale-result suppression is being verified. Do not treat pre-fix fresh-login success as reload acceptance.

Weekly scheduled run35526286124 on the older backend reported79 processed/1 failed. Concurrent provider logs show missing DeepSeek configuration and rejected malformed Gemini JSON, but do not identify the failed item cause. No rerun occurred. Backend b322ac6 adds privacy-safe allowlisted exception classification for future failures; the historical failure stays unclassified. See backend/docs/weekly-job-failure-classification-2026-09-20.md.

## Resumed verification — 24 September (IST)

The interrupted 20 September browser fixture was explicitly removed on resumption; global revocation, auth absence and application-row cascades verified. A separate fresh fixture was then created for continuation. Candidate a944285 was READY and promoted as dpl_BG88jCjAnGy5vYo2RH8pqFtGuw6E. Its bounded Retry screen works, but cold reload immediately failed and Retry recovered. This is a separate initial-session revision race, not proof that the earlier singleton change completed acceptance. A targeted fix and deployed recheck are required.

Read-only monitor35891197530 genuinely failed: health/revision/maintenance passed, but receipts were186.5minutes old against the120-minute threshold. Do not label monitoring universally healthy or relax thresholds to erase this finding. Both server daily/outbox variables remain false. No receipt/send/content job was manually rerun. GitHub scheduling reliability remains an operational acceptance gap.

## Latest release checkpoint — 24 September

Backend1673c1479a1dc9c579a94af5b2cd6cdfb61154aa is live on Railway099478be-67d6-4e15-9992-8a0481aebe79.642tests and CI35909696539 pass; exact health healthy. Deterministic Tomo fallback now honors request language, translates its owned Hindi copy and keeps custom labels and saved notification preferences intact. No generated provider content or sending policy changed. Read-only readiness35909949244 passes again; this does not erase the earlier receipt freshness breach.

Webd39ad2c5607357c87432ada9ed327c58f3fdfc0a is promoted to aritomo.in as dpl_5QkwZBza1UPEVEtoXdXJqoncNp6J, URLhttps://aritomo-mzdlp0wdh-pinegrass.vercel.app.132tests/13files, ESLint, TypeScript and15-page production build pass. Initial session hydration now permits only the matching empty-to-account transition; logout, account switches and logout/return races remain rejected by regression tests.

Final cold reload was initiated but its completion was not observable after the browser-control surface became unavailable. It remains **UNVERIFIED**, alongside live Hindi fallback rendering. Earlier report/decimal/planning/consent/trial journeys remain valid evidence for their unchanged behavior; they do not substitute for this last check. Both temporary accounts from the interrupted and resumed sessions were removed; the final helper verified global logout, auth absence and application cascades, and deleted its credential manifest. No existing user records removed.

Next bounded acceptance: disposable fresh login and cold reload on d39ad2c, then Hindi deterministic nudge rendering on1673c14. Do not rebuild or redeploy unchanged source just to repeat that check. Physical device, payment/provider, legal/human review, load/recovery and elapsed-pilot gates remain open.
