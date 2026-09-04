# Active Task
ID: ARI-RELEASE-VERIFY
Title: Verify mobile, web and backend release state
Status: REPORTED ACTIVE MILESTONE

## Goal
Prove TestFlight/mobile and Razorpay web subscription behavior against current code/deployments.
## Why
Recent handoffs report readiness, but live state was not independently checked here.
## Included
Three-repo gates, auth/API/billing contracts, entitlement webhook/reconcile, mobile build smoke.
## Excluded
New finance features.
## Acceptance Criteria
Gates pass; deployed commits/config are recorded; payment/entitlement succeeds; mobile build is installable.
## Relevant Areas
Parent `src/`; `backend/`; `aritomo-web/`; release docs.
## Required Verification
Parent tests/typecheck/lint; web quality/build; backend tests; staging/live smoke.
## Dependencies / Blockers
External service/release access.
## Next Executable Step
Run local gates in each repository and record exact HEAD/result.
