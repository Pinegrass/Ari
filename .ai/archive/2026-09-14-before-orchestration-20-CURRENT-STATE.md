# Current state — 13 September 2026

Smart Ledger negative-net display fixed in mobile `0f70898880f93e25075b9ed7f3b0203593e21eaa`: signed locale-aware net, private mask and neutral private net color. Six new screen cases; 32 focused tests across four suites pass, TypeScript and changed-source lint pass. Prior full mobile suite remains historical 534 tests; not rerun today. No device testing today.

Implementation audit: `docs/product-programme-2026-09/implementation-audit-2026-09-13.md`. Reviews, confirmed-cash planning, inbox/nudge infrastructure, measurement, Hindi foundations, approved prices/trial and Android usability fixes implemented. Full programme incomplete; report separates implementation, delivery and observed behavior.

Backend `c05a77ffa07b3ccd6a1edde49b0678ec0f52000d` live on Railway deployment `14764053-885e-4299-a78b-8f17faf32068`; 12 September evidence: 28 live checks, exact health revision, existing Supabase persistence/cleanup. Web source `c10caca1b381d3d2cd351554f165b404c53f9242` unpublished; last verified live `7d11e4f5d28a6defed8613a15123044a5c6e1663`.

Latest physically verified Android: Samsung SM_M166P API36, v61, internal update `01a09995-993e-741b-9fff-f2e8c017a182`, source `5ba6d31`; five targeted journeys pass on 13 September. QA entry/planning removed and networks restored. Today's net fix publication is recorded in latest handoff when complete; not physically verified.

Owner-approved pricing ₹149/month / ₹1,499/year, 14-day no-card trial after first entry. BillDesk incomplete; Play submission permissions/catalog/RevenueCat offerings and actual purchase/restore unresolved. Outbox automatic sends gated off pending real delivery/receipts. iPhone deferred; full Hindi/accessibility review remains. No web/production-channel/native/store release today.

Net fix subsequently published internally: update `01a09a28-cb33-785d-8ab3-61e14353ee89`, group `ea93b358-a687-4c4d-9ab6-a60d32c67317`, compatible runtime verified. Installation/physical acceptance of this update remains unverified.

## Calm daily Home — latest implementation

Owner-approved simplification committed in `c02374a227d45b9cf82c5aed352721965a9e0b1a`. One spending hero, compact header, optional compact nudge, three recent entries and review/planning links. Removed duplicate Home summaries/chart/habit stack. Paise preserved; retained monthly component uses recorded net and hides percentage. English/Hindi copy. Full mobile52suites/546tests, types and changed-source lint pass; synthetic RN Web phone-width checks pass with documented limits. LOCAL/UNPUBLISHED; no native test or deployment. Latest report `docs/product-programme-2026-09/calm-home-2026-09-13.md`.

## Daily nudges — latest local implementation

Mobile d0093c5/backend b855630/web7a1533f implement shared priority, direct routes, acknowledged24-hour dismissal and9/14/19 local-time opportunities. One attempt/window,3per localday/default21perrollingweek; existing lower limits preserved. Mobile556/backend309/web12tests, types/scopedlint and webbuild pass. Daily scheduler/endpoint gates off; no release or actual delivery. See daily-nudges-2026-09-13.md. Earlier live/source distinctions above remain historical.

## Coordinated release — latest

Backend b855630 live Railway ba6152e3-8e20-4495-bad9-6ba1260b8455; exact health and40 live checks pass, including Supabase persistence, nudge priority/dismissal and fixture cleanup. Android dfdaec1 published internal-release update01a09ba2-b520-7bc6-a812-ca4382a245f2/group860cb92d-cb0c-4ab1-8dee-15e7dd150c97; fingerprint matches v61. No device installation check. Web7a1533f READY production dpl_12kGaGyRybh341rWWq9HH5r2YwpA at aritomo.in; cloud build and landing/sign-in browser smoke checks pass. Existing Hindi promotional-copy gap observed.

Daily sending explicitly disabled on Railway, GitHub daily/outbox gates unset. Authenticated disabled endpoint checked0; no real sends. Next: isolated actual push/receipt plus PostgreSQL concurrent daily-worker acceptance before enabling. Android physical acceptance still outstanding. Store/payment/iOS/Hindi/accessibility/operations/pilot gaps unchanged.

All three source branches pushed. No source edits or repeated local suites; prior556/309/12 tests remain evidence. Report docs/product-programme-2026-09/coordinated-release-2026-09-13.md includes exact artifacts, boundaries and rollback references. No migrations; no Play/native/production OTA/iOS actions. Unrelated untracked files preserved.
