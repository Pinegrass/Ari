# Latest handoff — bounded measurement maintenance

Backend7209325904a9814bceb5a44cad2bbee5d309563f committed locally; mobile3035cb3 and authoritative web860b420 unchanged. Cold-start deltas were documentation only. Existing S1 notification PostgreSQL evidence inspected, not rerun; device/provider acceptance still pending.

V2 cleanup now processes100-account keyset pages, retaining shared user locks only through one page transaction and tolerating deleted accounts after selection. Internal UUID cursor validation and scheduled runner aggregation/repeated-cursor/malformed-count/uncertain-request protections implemented. Legacy count/delivery cleanup runs once on first page; it remains globally unbounded. Report memory and notification tombstone policy are still open.

415 full backend tests, scoped Ruff and diff checks pass. Independent agent's new PostgreSQL verifier exercised103 accounts over100/3 pages plus selected-then-withdrawn/deleted races; root reviewed source/proof. Dedicated fixture and container removed. No application config/provider/device/live data used by verifier. Unchanged mobile/web suites not rerun.

Evidence: docs/product-programme-2026-09/maintenance-pages-2026-09-19.md. Publish new runner before/with backend on authorized release: old runner stops after one page. Prior measurement migration/client ordering and compatible planning rollback requirements persist. No push, deployment, migration, scheduler invocation, permission or gate change. Daily/outbox remain off; device hold and iPhone deferral persist. No sprint newly accepted.

Continue independent engineering from ledger and programme-gap map. Do not conflate this bounded account-lock fix with all operational scalability or actual retention acceptance. Historical untracked docs and web AGENTS/CLAUDE preserved.
