# Integration PR — draft description

Paste into the PR body when opening `integrate-scaffolding → main` on `pinegrass/ari`, after migration steps 1–3 complete on Windows.

**Suggested title:**

```
chore: re-apply scaffolding after ejjy/Ari → pinegrass/ari consolidation
```

**Suggested labels:** `migration`, `no-code-change`, `documentation`

---

## PR body — paste from the `---` markers below

---

## Summary

Re-applies the launch-readiness scaffolding originally landed via PR #1 (`feat: light onboarding (3 slides) + theme system foundation`), now on top of the migrated codebase.

This is a **structural / consolidation PR with no new code**. The file contents are identical to what was on `main` before the `ejjy/Ari` → `pinegrass/ari` consolidation force-pushed the full `ejjy/Ari` history into this repo.

## Background

The repo consolidation force-pushed `ejjy/Ari/master` (`8ce9903`) onto `pinegrass/ari/main`, which superseded the squash-merge commit `18c69050` of PR #1. This PR re-applies that same commit on top of the new history so the scaffolding lives alongside the production codebase.

Mechanism: `git cherry-pick 18c69050` (Option B from the migration plan — single squashed commit, no commit-by-commit noise).

Reference: PR #1 (now closed via merge before the migration; the merge commit is no longer reachable from `main` but the branch `claude/verify-firebase-sha1-P4VFj` is preserved for history).

## What's brought in

| Area | Files | Purpose |
|---|---|---|
| Theme system | `src/theme/tokens.ts`, `ThemeProvider.tsx`, `useTheme.ts` | Semantic tokens (light + dark), system-preference-aware provider |
| Onboarding | `src/screens/Onboarding/*` | 3-slide light-theme welcome flow, AsyncStorage-gated |
| Account deletion (Play compliance) | `src/screens/Settings/DeleteAccountScreen.tsx`, `src/api/account.ts` | In-app deletion UI + API client |
| Error messages | `src/errors/messages.ts` + `index.ts` | Internal error → user copy library |
| Observability | `src/observability/sentry.ts` | Sentry init + auth-funnel breadcrumbs |
| Offline UX | `src/components/OfflineBanner.tsx` | NetInfo-driven offline indicator |
| Documentation | `docs/legal/privacy-policy.md`, `docs/runbooks/launch-day.md`, `docs/play-store-listing.md`, `docs/play-production-application.md`, `docs/account-deletion-compliance.md`, `docs/backend/delete-account-endpoint.md`, `docs/web/account-deletion-request.html` | Play Store + launch readiness |
| Tooling | `scripts/find-hardcoded-colors.sh`, `.github/workflows/ci.yml` | Color audit + CI template |

## What's NOT in scope

- No changes to the production app code introduced by `8ce9903`.
- No new features.
- No integration of the scaffolding into the live app — that work still belongs to the dev (wiring `ThemeProvider`, the `OnboardingScreen` gate, Sentry init, navigator entries for the delete-account screen, etc.).

## Verification

- [ ] CI passes (template mode — no `package.json` yet means the workflow logs a notice and exits clean).
- [ ] File tree under `src/`, `docs/`, `scripts/`, `.github/` matches the squash-merged content of PR #1 (`18c69050`).
- [ ] No conflicts surfaced during cherry-pick (expected — these are new additions relative to the migrated `8ce9903` history).
- [ ] `git log --oneline main` shows the migration force-push as the most recent non-merge history below this PR's commit.

## After merge

- Drop the supersede comment on the (already merged) PR #1, linking to this PR as the canonical post-migration landing point.
- Begin per-screen color migration work (the "Option B last-mile" deferred from PR #1) against the now-unified codebase.
- Resume the production-AAB build workflow from the migrated working directory once smoke-testing of the preview APK is complete.
