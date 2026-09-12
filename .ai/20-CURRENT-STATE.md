# Current state — 12 September 2026

The five Android user-journey findings are fixed locally. Mobile `5ba6d31`, backend `c05a77f`, web `c10caca`. Source and evidence: `docs/product-programme-2026-09/usability-fixes-2026-09-12.md`.

Planning retries preserve drafts; date picking and inline validation prevent invalid submissions. INR paise work through entry, server validation and display. Report drilldown retains dates. Home/history and confirmed deletion are easier to reach.

Verification: 534 mobile tests (50 suites), 301 backend tests, 12 web tests. Types, changed-source lint, web build pass. No device testing or release in this implementation turn. Backend must deploy before the client paise change.

Last exercised phone: Samsung SM_M166P API36, v61, internal update `01a0948a-72b6-7334-ae99-f209255c567e` from mobile `1c6077d`. Physical walkthrough completed, temporary entry deleted, original baseline restored. These new fixes are not on that phone.

Live backend remains `a4014a860d8f6efd17df26f5d1d27e3efb53f717`; live web remains `7d11e4f5d28a6defed8613a15123044a5c6e1663`. Local backend also contains the earlier midnight planning-expiry fix, still undeployed.

Owner approved ₹149/month or ₹1,499/year, 14-day no-card trial after first entry. BillDesk incomplete; iPhone deferred to Codemagic/later. Google Play internal submission permission/catalog and real purchase/restore remain blocked. Actual push delivery/receipts and full native Hindi review unverified; automated outbox sends gated off. No new production OTA, Play submission or build.
