# Latest handoff — Physical user journey completed
Updated:2026-09-12

Owner explicitly requested real-user connected-device testing and replied ready; earlier no-device restriction superseded for this task. SamsungR9ZY6046FML SM_M166P API36 tested about14:02–14:11IST. Existing nativev61 now verified running latest downloaded update01a0948a-72b6-7334-ae99-f209255c567e/source1c6077d/runtimef82b9c561785202f8057920d7a8a052d15c1ed33/internal-release. About identity saved privately as qa-latest-identity.xml.

Five observed pain points: planning Try again erases dirty draft; INR keypad lacks decimal entry; report Review entries drops selected period; See all transactions leads to Trends/charts and delete is hard to discover; payday uses alphabetic keyboard and validation lacks field-specific feedback. Full evidence/recommendations: docs/product-programme-2026-09/device-user-journey-2026-09-12.md. No app fixes made in this testing turn.

QA entry AriQA12Sep created1→edited2→confirmeddeleted. Final Home0today/38entries matches baseline; daily server-backed report0entries. No original ledger edits, trial or preference changes. Planning invalid request rejected, no snapshot saved; retry cleared temporary1000cashdraft. Left Ari Home. One existing entry was opened accidentally and closed without saving. Financial screenshots/XML stay outsideGit under D:/Codex/Artifacts/Ari/2026-09-11.

Only client is current on device; live backenda4014a8predates local84f4df4midnight fix. No claim of latest backend integration, payment/restore, voice, offline or push verification in this run. No production OTA/backend/web deployment. Local prior tests522mobile/300backend/11web pass. Existing Play service-account/catalog/BillDesk blocks persist. Do not count prior app contention or UIAutomator idle failures as Ari usability findings.
