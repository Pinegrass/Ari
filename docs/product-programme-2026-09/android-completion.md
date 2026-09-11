# Android completion — 12 September 2026

Owner priority: complete Android; defer iPhone testing to Codemagic/later. BillDesk verification remains incomplete. Approved offer: ₹149/month, ₹1,499/year, one 14-day no-card trial after the first recorded entry, with no automatic charge.

## Release identity

| Surface | Source / status |
| --- | --- |
| Android | `e9d1cb4e6263b0760a2ca9d07646774f65658498`, pushed branch `codex/ari-android-product-20260911`; canonical mobile source matches |
| Final Android build | 1.3.0 / code61, EAS `51376781-e083-42f3-9724-8bd16cc006fd`, finished; validated and installed on Samsung and isolated emulator |
| Runtime / channel | `f82b9c561785202f8057920d7a8a052d15c1ed33` / `internal-release` |
| Tested internal update | `01a091a7-599c-792a-8f93-d20073fa2834`, group `d0a2b486-de7e-47c7-8629-c9eeb03110e2`, Android only; exact identity verified in About |
| Backend | `a4014a860d8f6efd17df26f5d1d27e3efb53f717`, live Railway `ef35a25b-a2d1-4a05-a972-3741b6f44f7f`; health revision verified |
| Web | Live HEAD `7d11e4f5d28a6defed8613a15123044a5c6e1663`; local product changes verified but not deployed |

v58-v60 are superseded for distribution. No production OTA. Google Play production v57 was confirmed completed by a read-only track inspection; this is a separate earlier artifact.

## Implemented product work

- Five-period recorded-ledger reviews, historical navigation and updates inbox, with explicit missing-data limits and English/Hindi coverage.
- Confirmed-cash payday planning with reserve and dated obligations; Decimal calculations; incomplete, stale, changed-ledger and currency checks; background invalidation and private-mode masking.
- Consent-only first-party event counts: approved event names only, no raw properties, private-mode blocking, withdrawal deletion, export and90-day retention.
- Notification preferences, quiet hours, durable deduplication, receipt lifecycle and freshness-limited outbox. Automatic outbox scheduler is gated off until actual provider delivery/receipt verification.
- Server-authoritative no-card trial, consistent trial billing tier, and approved price definitions. New paid checkout remains unavailable until provider catalog/merchant setup is completed; legacy reconciliation remains supported.

## Defects caught and fixed during Android testing

1. v58 startup crashed because the More navigation label referenced a missing translation. Typed keys, English/Hindi labels, a runtime fallback and regressions fix it.
2. Planning's bottom action could overlap Samsung system navigation. Planning, reports, inbox and fallback paywall stack screens now respect both safe-area edges.
3. Offline cold start loaded a cached user but still waited for server validation. Cached navigation now opens immediately; a genuine401 still removes the session.
4. Temporary network failures exhausted the same six-attempt limit as invalid entries. Retryable failure classification now preserves temporary failures; legacy entries stuck with `Network unavailable` recover automatically. Permanent validation failures retain bounded retries.
5. Trial eligibility refreshes on navigation focus, account changes and explicit retry, so returning after a recorded entry refreshes availability.

## Verification

| Check | Evidence |
| --- | --- |
| Mobile automated | 45 suites /516 tests; TypeScript; changed-file lint pass. Final comment/test cleanup rechecked separately. |
| Backend automated | 299 tests;66 feature checks against isolated PostgreSQL16; final trial billing correction also passed15PostgreSQL product checks. |
| Live API | 29 authenticated HTTP checks with a disposable account, including trial, planning, consent, export, all five Hindi report periods and account deletion. Fixtures deleted. |
| Web local | Nine tests, lint, TypeScript and production build pass; no web deployment. |
| Samsung SM_M166P / API36 | Data-preserving v58 install and internal-update recovery; Home/More; English→Hindi→English; inbox empty state; planning1000.10−200−100=700.10,70.01/day; background invalidation; test planning deletion. |
| Isolated AOSP API36 emulator | Normal sign-in; five empty report periods; previous year2025; private planning mask; planning controls accessible at150% font scale; restored1.0. |
| Offline recovery on emulator | Real entry persisted locally; initially failed six times with `Network unavailable` and zero server entries. Updated app recovered exactly one server entry; offline cold launch then displayed cached data promptly. |
| Trial on emulator | Became eligible after sync; activated through UI without payment details; UI end date25September and database duration exactly14days. |
| Edit/delete on emulator | UI changed test amount1→2; database confirmed one2.00entry; confirmed UI deletion and database count0. |
| Update identity | About shows downloaded update01a091a7, expected runtime/internal channel; manual check reports up to date. |

Earlier Samsung contention was resolved after the owner replied ready. Final v61 was installed preserving data; versionCode61, Home, More and the existing session passed. About showed the exact embedded manifest `eaddd186-3a7d-4d79-8181-0dcdffd4e92d`, expected runtime/channel and up-to-date status. Planning controls were visually verified above Samsung system navigation. Ari was returned to Home. No owner ledger entries or one-time trial were changed.

Fresh native v61 on the emulator passed offline first launch/onboarding, normal online sign-in, Home/More and the same embedded manifest identity. The first sign-in snapshot was still processing; the subsequent Home check succeeded without changes. Captured Samsung logs contained a RevenueCat offerings ConfigurationError consistent with the unresolved Play catalog; no AndroidRuntime crash appeared in that captured check.

## Database and operations

Four additive production migrations were applied after isolated PostgreSQL validation. RLS is enabled and anon/authenticated table privileges are absent for the five new server-only tables. Local migration application twice, uniqueness/cascades and overlapping-worker reservation checks passed. The dedicated local PostgreSQL container was stopped.

| Local migration | Applied remote history version |
| --- | --- |
| 20260911130428 notification_policy | 20260911164256 |
| 20260911145248 push_receipts | 20260911164259 |
| 20260911151857 deferred_nudges | 20260911164303 |
| 20260911160046 planning_measurement_trial | 20260911164307 |

Reconcile this history before CLI migration push. Existing advisor warnings remain for function search paths/security-definer exposure and disabled leaked-password protection; no claim of resolving those settings. Server-only tables intentionally have no client policies.

## External limits

BillDesk is incomplete by owner confirmation. Google catalog region metadata returned403; no subscription products were created. Google release access was independently verified: temporary edit200, track read200, discard204. Actual Play purchase/restore remains unverified. iPhone testing is deferred. Full native/legal Hindi review and actual push display/receipt evidence remain outside the completed checks. No paid Supabase branch was created.

An additional shell API verification command was rejected by automatic approval review with `blocked by policy`. No identical retry was made; UI evidence and scoped read-only database counts were used instead.

Private logs, device snapshots, fixture scripts and build metadata: `D:/Codex/Artifacts/Ari/2026-09-11`. Do not commit credentials, local databases or financial screenshots. Disposable emulator account was deleted through password-confirmed account deletion. Scoped database verification returned zero app users and zero auth users for that fixture; test entries were already zero. Emulator app data was cleared and emulator-5580 stopped. Temporary copied service-account key in the release worktree and the private local database copy were removed; original signing/service credentials remain unchanged.


## Final artifacts and distribution

- Source: `e9d1cb4e6263b0760a2ca9d07646774f65658498` (later documentation commits are not build source).
- [Signed v61 AAB](https://expo.dev/artifacts/eas/I3ETev1ip7rk2YMTEXgjC7RRVvklaZOY87XPBmdA45A.aab), 89,178,280 bytes. Local `D:/Codex/Artifacts/Ari/2026-09-11/ari-product-v61.aab`.
- AAB SHA256: `a0c0b5b5419bd3539f1277e52a7da2e6a1499164f391db6f7bbf6072ac4e26b3`.
- Samsung APK-set SHA256: `3b739855655e40b18a09ff49ad70b60954057cd8f4b1985775e468251c7a8b69`.
- Emulator APK-set SHA256: `55c4c2d7139e1cb10cdb5b7df16b7fb671096f5c5b398b06b49fa6c8087b6436`.
- [Internal submission](https://expo.dev/accounts/pinegrass-tech/projects/ari/submissions/348b172e-aef5-49c1-bc11-0e59926a0cc9) failed: service account is missing the necessary permissions to submit the app to Google Play Store. The CLI exited1. No v61 Play release occurred.
- Post-failure API inspection verified production57completed and internal57draft/5completed unchanged; temporary edit discarded204. Release edit/read permission does not establish upload permission.

To resume distribution, correct the service account's Play app release permissions or upload this exact signed AAB through an authorised Play Console account. Retry the internal track only; no rebuild is required for this permission failure. BillDesk, catalog/RevenueCat offerings and actual paid purchase/restore are separate incomplete commercial checks.

Private final evidence: `v61-embedded-about.xml`, `v61-samsung-embedded-about.xml`, `v61-samsung-home.jsonl`, `v61-samsung-planning-safe-area.png`, `v61-samsung-install.log`, `v61-samsung-runtime-errors.txt`, `product-android-v61-artifact-verification.json`, `product-android-v61-emulator-verification.json`, `google-release-access.json`. These stay outside Git.
