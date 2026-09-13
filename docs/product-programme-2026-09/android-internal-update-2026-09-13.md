# Android internal usability update — 13 September 2026

Owner said go to publishing the Android internal update and verifying it on the connected phone.

Published Android only to internal-release, using EAS production environment (existing live backend). Source `5ba6d31614ee6ee93fa03cd3461ad210af181e2f` from clean isolated worktree `D:/Codex/Worktrees/ari-android-product-20260911`.

- Update: `01a09995-993e-741b-9fff-f2e8c017a182`
- Group: `c6c1a184-e6fe-4873-942c-8ebb7f7f958a`
- Runtime: `f82b9c561785202f8057920d7a8a052d15c1ed33`
- Published: `2026-09-13T07:05:13.278Z`
- Project: `ae18eabf-124f-4b0a-a09e-a2a40dfb473b`, pinegrass-tech.

EAS fingerprint generation independently matched the installed v61 runtime. No native dependency/config differences from the previously tested source. Export and publication succeeded; no new native build, Play submission or production-channel update.

Backend health rechecked at exact deployed c05a77f. Samsung R9ZY6046FML connected, native1.3.0/code61 confirmed, but Darelight was foreground. Asked owner to leave Ari open and reply ready; no response by checkpoint. No device interactions or user-data changes. New update application and the five physical regression journeys remain UNVERIFIED. Continue after ready; confirm full update ID in About before testing. Preserve original entries and remove only explicitly named QA fixtures.

Evidence: D:/Codex/Artifacts/Ari/android-usability-update-2026-09-13.json and android-usability-fingerprint-2026-09-13.json. Automated implementation checks previously passed534mobiletests,301backendtests,12webtests. Web release and external commercial/notification/iOS gates remain pending.
