# Current state — 12 September 2026

Android product completion is active. Owner approves ₹149/month, ₹1,499/year and a 14-day no-card trial after the first recorded entry. BillDesk verification remains incomplete; iPhone testing is deferred to Codemagic/later.

- Mobile source: `e9d1cb4e6263b0760a2ca9d07646774f65658498`, master locally and pushed candidate branch `codex/ari-android-product-20260911`. 45 suites/516 tests, TypeScript and lint pass. v61 EAS `51376781-e083-42f3-9724-8bd16cc006fd` finished, installed and verified on Samsung and emulator on internal-release; runtime `f82b9c561785202f8057920d7a8a052d15c1ed33`.
- Backend: `a4014a860d8f6efd17df26f5d1d27e3efb53f717` live, Railway `ef35a25b-a2d1-4a05-a972-3741b6f44f7f`. 299 tests, 66 PostgreSQL feature checks, 29 authenticated live API checks pass. Four additive migrations applied; RLS verified; synthetic accounts deleted. Local test container stopped. Automated outbox sends gated off pending real delivery checks.
- Web: `7d11e4f5d28a6defed8613a15123044a5c6e1663` remains live; local product changes pass nine tests, types, lint and production build, but are not deployed.

Android v61 is installed preserving the Samsung session and data. Final Home/More, embedded bundle identity and planning safe-area fix verified. Emulator checks passed all report periods/history, private planning, enlarged text, offline cold start and recovery exactly once, UI trial activation, edit/delete. Disposable account deleted (app/auth counts0), emulator data cleared and emulator stopped. v58-v60 superseded.

Google Play internal submission348b172e-aef5-49c1-bc11-0e59926a0cc9 failed: service account lacks submission permission. Post-failure track inspection confirms production57completed/internal57draft and5completed unchanged. Edit/read access alone is insufficient. No new Play distribution or production OTA. Catalog403 and RevenueCat missing offerings remain; real purchase/restore blocked. Copied worktree credential removed.

Evidence: `docs/product-programme-2026-09/android-completion.md`. Historical release checkpoints are archived; earlier phone-free and unapproved-pricing restrictions are superseded. Other programme gaps include full Hindi/native review, real push receipt evidence and web delivery.
