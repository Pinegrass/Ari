# Current state — 12 September 2026

The five Android user-journey findings are fixed locally. Mobile `5ba6d31`, backend `c05a77f`, web `c10caca`. Source and evidence: `docs/product-programme-2026-09/usability-fixes-2026-09-12.md`.

Planning retries preserve drafts; date picking and inline validation prevent invalid submissions. INR paise work through entry, server validation and display. Report drilldown retains dates. Home/history and confirmed deletion are easier to reach.

Verification: 534 mobile tests (50 suites), 301 backend tests, 12 web tests. Types, changed-source lint, web build pass. No device testing. Backend subsequently deployed with owner approval; client fixes remain unpublished.

Last exercised phone: Samsung SM_M166P API36, v61, internal update `01a0948a-72b6-7334-ae99-f209255c567e` from mobile `1c6077d`. Physical walkthrough completed, temporary entry deleted, original baseline restored. These new fixes are not on that phone.

Live backend is `c05a77ffa07b3ccd6a1edde49b0678ec0f52000d`, Railway `14764053-885e-4299-a78b-8f17faf32068`. 28 live checks pass, Supabase persistence and synthetic cleanup verified. Both paise support and midnight planning expiry are live. Live web remains `7d11e4f5d28a6defed8613a15123044a5c6e1663`.

Owner approved ₹149/month or ₹1,499/year, 14-day no-card trial after first entry. BillDesk incomplete; iPhone deferred to Codemagic/later. Google Play internal submission permission/catalog and real purchase/restore remain blocked. Actual push delivery/receipts and full native Hindi review unverified; automated outbox sends gated off. No new production OTA, Play submission or build.
