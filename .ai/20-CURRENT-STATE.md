# Current state — 22 November 2026

Focused compatible report OTA candidate on codex/ari-reports-ota-v57, based on
public version-57 source 4b4ae8e. The public runtime is
84cc28590bb0a1fffcf4a346d97bd40e18faac45 and its channel is internal-release.
Both baseline and report candidate fingerprints reproduce it without overrides.

Reports have personal ledger-based habits, weekly/monthly Home shortcuts,
privacy protection, signed net cash flow, refresh recovery and dated push routes.
Navigation 7 removes the vulnerable query decoder. TypeScript and 508 tests pass;
production Android Hermes export passes. Details: docs/reports-ota-v57-2026-11-22.md.

The XML config-plugin dependency remains at the installed native version and has
a known high build-tool advisory. It is absent from the application source map.
The security gate remains open. No production OTA, Play submission or notification
sending was performed. Worldwide six-language/native work remains in PR #10.

Backend live fdd03c4 and web remote f871456 remain independent. Backend candidate
PR #23 prevents account-unit relabeling and passes 705 local tests. Its private
GitHub jobs still fail before startup for payment/spending limits. Expo is upgraded
and builds work. Preserve the canonical checkouts' unrelated prepared changes.
