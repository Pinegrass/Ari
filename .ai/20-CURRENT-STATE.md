# Current state â€” 22 November 2026

Ari remains free. Public Play is 1.3.0 (57). Worldwide draft PR10 adds English,
Hindi, Spanish, French, Brazilian Portuguese and Arabic. Navigation7 and patched
Expo dependencies pass 711tests, TypeScript, lint,21/21Doctor and zero audit findings.
Source e17c6c1 is the application baseline; a7619e1 changes only tests/workflow.

Expo upgrade is owner-confirmed and build 541b5b79-fa8a-4dac-bdbc-5d808860b164
succeeded. Existing five Maestro journeys and focused report period/privacy QA
passed (runs 44938263716/44940046041). Arabic QA 44940729174 also passes.

PR11 prepares report OTA from public4b4ae8e. Clean install reproduces runtime
84cc28590bb0a1fffcf4a346d97bd40e18faac45 without overriding it. 508tests,
typecheck/lint and Hermes export pass. QA group 2633d53d-8a59-4732-8e33-4ec8e8a5dec1
is staged on ari-reports-v57-87298ab-qa. Public internal-release remains unchanged
and returns204. Its old XML native config-plugin advisory is retained, audit not
waived; security and installed-v57 canary acceptance are open. No public release.

Backend live fdd03c4. Candidate PR23/d24d921 prevents profile currency relabeling,
passes705 local tests, undeployed. Private CI 44939774769 cannot start because of
GitHub payment/spending restrictions. Owner says GitHub billing is pending.
Maintenance/automatic reporting freshness and backend staging remain open.
Daily/outbox sending remains disabled; monthly acceptance is due 1December09IST.
Web remote f871456 remains independent and its deployment is not reverified.

Read docs/audits/2026-11-22/navigation-reports-release.md for exact artifacts and
remaining worldwide work: signup verification, new-market currency contracts,
sync/data-safety remediation, fluent translations/legal and Play listing review.
Canonical dirty changes remain preserved. Previous compact pack is archived in
.ai/archive/2026-11-22-before-navigation-ota/.
