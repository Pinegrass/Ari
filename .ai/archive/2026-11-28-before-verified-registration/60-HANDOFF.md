# Latest handoff — report OTA, 22 November 2026

Candidate: codex/ari-reports-ota-v57, public native source 4b4ae8e.
508 tests, TypeScript and Android Hermes export pass. Runtime exactly matches
84cc28590bb0a1fffcf4a346d97bd40e18faac45. Original eas.json is unchanged.
All native packages retain installed versions; navigation JS is patched.

Read docs/reports-ota-v57-2026-11-22.md before publishing. The original XML
config-plugin advisory is retained for native compatibility and not waived.
No production OTA publication or installed-v57 canary acceptance is claimed.
Use a QA branch without changing the public internal-release channel mapping.
Artifacts/mirror: D:/Codex/Artifacts/Ari/2026-11-22/. Node modules are on D:;
perform fingerprints/export from ota-runtime, after copying exact source files.

Expo upgrade verified with successful worldwide EAS build
541b5b79-fa8a-4dac-bdbc-5d808860b164 and five green Maestro flows in run44938263716.
Report-specific Maestro acceptance is running against that existing artifact in
44940046041; this is a different native runtime, not installed-v57 acceptance.
GitHub organization billing remains pending. Daily/outbox sending stays disabled.

QA group 2633d53d-8a59-4732-8e33-4ec8e8a5dec1 is staged on unreferenced
ari-reports-v57-87298ab-qa at runtime84cc2859. Public internal-release still
returns204 and its channel mapping is unchanged. Clean npm ci reproduces84cc.
Remote CI44940420540 passed tests/typecheck/lint, failed retained XML audit.
Worldwide native report/privacy flow passed in44940046041; public-v57 canary
acceptance remains pending. PR11 targets codex/ari-public-v57 maintenance branch.
