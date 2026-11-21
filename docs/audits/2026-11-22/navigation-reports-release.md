# Navigation, reports and release checkpoint

Ari remains free. Public Play stays at 1.3.0 (57); no new Play submission or
production OTA was made. The owner confirmed Expo is upgraded and GitHub billing
is pending. Builds now work in Expo; private backend jobs still fail before startup.

## Fixed and verified

The worldwide candidate upgrades React Navigation to version 7 and removes its
vulnerable URL decoder. Auth links and existing-tab navigation preserve the back
stack; root transitions use the supported animation API and navigation direction
follows native RTL. Stack-router regressions exercise back navigation, historical
report parameters and international URL parameters. Unused Babel alias tooling
was removed. Expo package patches and ordinary npm peer resolution are aligned
between CI and EAS. An initial build failed npm ci; the corrected lockfile succeeds.

Source `e17c6c138087ad85f693c2280dbec338ac6ca234` passes all 711 tests across
72 suites, TypeScript, lint, all 21 Expo Doctor checks and an audit with zero
vulnerabilities. Later source `a7619e1` changes only Maestro/workflow definitions;
application files and lockfile are identical. CI44940662856 also passes.

EAS Android e2e build `541b5b79-fa8a-4dac-bdbc-5d808860b164` finished successfully:
version1.3.0/code67, source metadata `81cbc323630783e071c454eb1401339fc6838a26`
(the PR merge commit), fingerprint `330e09cece8ffc2f6cf2f361361174537b088d6b`.
Maestro run44938263716 passed login, navigation, entry/edit, Tomo and export.
Run44940046041 reused this artifact and also passed weekly/monthly report period
navigation and Private Mode. The focused Arabic restart/persistence run44940729174 also passed: it switched
to Arabic, restarted the app, retained the language and restored English.
Screenshots were visually checked: Arabic text is right-aligned, the tabs mirror,
and restoring English returns the layout to left-to-right. This is not fluent
translation or legal acceptance.

Nightly tests reuse a finished build for the same commit. Draft PRs do not
automatically spend native builds; manual runs can select a verified artifact
and run reports or languages alone.

## Compatible report OTA

PR #11 is independent of the worldwide native branch and targets maintenance
branch `codex/ari-public-v57` at public source `4b4ae8e`. It adds personal
ledger-based habits, Home period shortcuts, signed net cash flow, report privacy,
refresh recovery and dated notification routing. It retains the installed
English interface and native dependencies. No native localization module is added.

Source `87298ab391f0804ae262af0403f43a13724bc3a2` passes 508 tests, TypeScript,
lint and production Android Hermes export. A clean npm ci reproduces the exact
public fingerprint `84cc28590bb0a1fffcf4a346d97bd40e18faac45` without overrides.
The source map contains neither the legacy query decoder nor XML build tools.

QA group `2633d53d-8a59-4732-8e33-4ec8e8a5dec1`, update
`01a1ff8f-06bf-7fb6-b8b9-a8efb4d533a5`, is staged on the unreferenced branch
`ari-reports-v57-87298ab-qa`. Public channel **internal-release** remains mapped
to its original branch. Its exact-runtime request still returns HTTP204.
The source, clean fingerprints, export, update metadata and native metadata are
under `D:/Codex/Artifacts/Ari/2026-11-22/`.

The installed fingerprint includes xmldom0.8.13 in the native config-plugin
toolchain. Its patched version changes the fingerprint. The compatible candidate
retains the old known high build-tool advisory, which is absent from the runtime
bundle. Its audit gate remains failed; no blanket exclusion or compatibility
override was added. The new native candidate is fully patched. Installed-v57
canary and security acceptance remain open before public OTA publication.

## Backend and provider gates

Backend PR #23, source `d24d921`, prevents profile country/currency edits from
relabeling financial history. It validates before mutation, returns409 for an
account-unit change and keeps ordinary profile edits. All 705 local tests pass.
Its private CI44939774769 fails before steps with the same payment/spending
restriction; this is not a pytest or audit failure in executed code. It is not
deployed. Separate staging acceptance is still required by backend instructions.

Production backend remains `fdd03c4db0871521335c04a24d2c65e76f50f97b`.
Canonical nested web remote remains `f87145694db3ba7f5c3c66595ffe9b7fcff74265`;
web deployment was not reverified. Unrelated canonical dirty changes are preserved.
Maintenance freshness and automatic coaching generation remain unaccepted until
normal private Actions runs resume. Daily and outbox sending remain disabled.
The monthly Railway acceptance window is 1 December at09:00IST; it cannot be
claimed early. Existing scheduled jobs are not rerun merely to manufacture evidence.

## Worldwide release still open

These artifacts close the navigation advisory, dependency-install/build failure,
existing native smoke checks and report/privacy regression gaps. They do not
establish a worldwide release. Remaining work includes the retained OTA toolchain
security gate and version57 canary, backend staging/CI and scheduler freshness,
signup email-verification behavior, new-market currency coverage (the current
contract remains IN/US/GB/AU), integration of the earlier sync/data-safety
remediation, fluent translation/legal review and matching Play listing acceptance.
Four new UI languages still disclose English detailed server explanations.

Billing action for the owner: resolve failed payment or the private Actions budget
in the Pinegrass organization. GitHub's annotation does not distinguish the two.
Expo upgrade is already confirmed; do not ask the owner to upgrade it again.
