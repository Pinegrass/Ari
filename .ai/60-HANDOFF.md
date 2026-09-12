# Latest handoff — Integration fixes complete locally
Updated:2026-09-12

User requested all three review fixes and explicitly NO on-device testing afterward. No phone/emulator/simulator testing, push, deployment, OTA or native build was performed. Preserve that restriction.

Local implementation commits: mobile 1c6077d6c6fea304218d7d92505295cee96672f8; backend 84f4df41bbac721184b21daf214904647c3493bb; canonical web 2b9647a1c814284214f555875dfa30c63a8105db. Web commit includes previously dirty programme source required for an integrated checkpoint. Generated web AGENTS.md/CLAUDE.md and unrelated release/archive files remain untracked; preserve them.

Fixed: account-local-midnight snapshot expiry with optional expiresAt response; client deadline checks and stale-response generations; web blur/visibility invalidation and focus/ledger revision reload; report-action/planning-save/trial-start event wiring through existing consent/privacy gates.

Tests:522mobile/47suites,300backend,11web/4suites pass. Types and changed-file lint pass; web production build passes. Evidence: docs/product-programme-2026-09/integration-fixes-2026-09-12.md. No schema change. New source is not live: installedv61/sourcee9d1cb4, backend a4014a8 and web7d11e4f are still the prior release evidence. Backend deployment must precede client distribution for expiresAt. No distribution authorised merely by fixes.

Remaining external blockers: Play release service-account permission, merchant/catalog and real purchase/restore, real push display/receipts (outbox gated off), full Hindi/native review and deferred iPhone. Review findings themselves resolved locally.
