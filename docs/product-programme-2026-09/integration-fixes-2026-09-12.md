# Integration fixes — 12 September 2026

All three review findings implemented locally. User explicitly prohibited subsequent on-device testing: no phone, emulator or remote simulator tests were run. No push, build publication, OTA or deployment was performed.

- Backend snapshots expire at the earlier of24hours and the account's next local midnight. GET retains obligation inputs but returns stale/no estimate after that boundary. New optional expiresAt timestamp lets clients stop displaying the estimate at the same instant. No schema migration.
- Mobile and web honour expiresAt, with24-hour fallback for older responses. Request generations prevent late fetch/save responses restoring an invalidated estimate.
- Web invalidates on blur/hidden, reloads on visible/focus and dashboard revision changes (including ledger refresh/account changes). Listeners clean up on unmount.
- Mobile report_action_started now reaches the first-party event endpoint. Both clients emit planning_saved and trial_started after successful operations; failed saves do not count. Existing consent and mobile Private Mode gates remain.

## Verification

Mobile47suites/522tests pass; backend300tests pass; web4suites/11tests pass. Mobile/web TypeScript, changed-file lint, web production build and diff whitespace checks pass. Regression coverage includes India midnight GET, preserving obligation inputs, client expiry, late save after invalidation, ledger revision reload, browser visibility listener cleanup, consent filtering and conversion payloads. One initially overloaded5-second trial test timed out; rerun with20-second test limit passed, as did the full mobile suite. No claims of updated live/native verification.

## Coordinated local source

- Mobile 1c6077d6c6fea304218d7d92505295cee96672f8
- Backend 84f4df41bbac721184b21daf214904647c3493bb
- Web 2b9647a1c814284214f555875dfa30c63a8105db

The web commit includes the previously uncommitted programme implementation required by these fixes, not just the latest freshness/event delta. All current web source was included in the passing build; generated AGENTS.md/CLAUDE.md remain untracked.

Release status is unchanged: installed Androidv61 and live backend a4014a8 predate these fixes; live web7d11e4f predates the product implementation. Deploy the backend before distributing clients to exercise the expiresAt contract. Existing Play submission permission, merchant/catalog, paid purchase/restore and real push-delivery gaps remain. iPhone testing stays deferred; no further device testing is authorised.
