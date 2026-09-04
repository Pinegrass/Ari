# Ari Agent Operating Protocol

Ari is a three-repository personal-finance system. Do not begin cross-surface work until you identify the owning repository and inspect its independent Git state.

## Mandatory cold start

Read `.ai/00-INDEX.md`, `.ai/20-CURRENT-STATE.md`, `.ai/60-HANDOFF.md`, `.ai/tasks/ACTIVE.md`, and `.ai/STATE.yaml`; then run `git status` and `git log -5 --oneline` in the repository you may change. For cross-surface work, repeat those Git checks in each affected nested repository. Inspect deltas from the recorded baseline before broader reading.

## Canonical repositories and boundaries

- Mobile: `D:/Codex/Workex/Ari` (`Pinegrass/Ari`, `master`). Owns Expo/React Native source under `src/`, EAS/native configuration, and mobile-facing migrations/support.
- Backend: `D:/Codex/Workex/Ari/backend` (`ari-backend`, `master`). Separate nested Git repository. Owns Flask/SQLAlchemy/PostgreSQL APIs, auth verification, coaching jobs, provider calls, payment webhooks, and server entitlement truth.
- Web: `D:/Codex/Workex/Ari/aritomo-web` (`aritomo-web`, `master`). Separate nested Git repository and the authoritative web checkout.
- `D:/Codex/Workex/aritomo-web` is an older standalone checkout. Do not modify or use it as current web truth unless the product owner explicitly changes the canonical selection.

A parent commit does not capture nested repository HEADs. A cross-repository release must record all three commits and verify auth/token, API, billing, and entitlement contracts. Modify only the repository that owns the behavior; coordinated contract changes require deliberate commits in every affected repository.

## Non-negotiable safeguards

- Never commit secrets. Mobile tokens use SecureStore; backend/provider secrets remain server-side.
- Web/mobile payment success is not entitlement truth. Razorpay/RevenueCat state is verified and reconciled by the backend.
- Ari is not a bank, broker, tax-filing service, or fiduciary adviser. Treat tax/finance outputs as bounded tooling.
- Use locale-aware money handling; do not reintroduce INR-only assumptions across supported currencies.
- Do not deploy, publish OTA/native builds, or push merely because code changed; follow the repository release workflow and record exact artifacts.
- Source and tests outrank inventories. Label live/TestFlight/Railway/provider claims UNVERIFIED until exercised.

## Task routing and verification

Mobile work: inspect `src/`, root config, and parent scripts. Backend work: enter `backend/` and use its own instructions/tests. Web work: enter nested `aritomo-web/` and use its own instructions/tests. For cross-surface billing/auth/API changes, verify all consumers and record all three HEADs.

Detailed commands, dependency/API/model inventories, design conventions, environment notes, and deployment background live in `.ai/guides/development-reference.md`. Load that guide only when relevant; prefer current manifests/source where it disagrees.

Before ending substantial work, update the compact continuity pack. Put durable decisions in `.ai/40-DECISIONS.md`, current reality in `20-CURRENT-STATE.md`, only the latest checkpoint in `60-HANDOFF.md`, and history in `.ai/archive/`.
