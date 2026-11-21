# Durable Decisions
## DEC-001 — Independent mobile, web and backend repositories
Status: ACCEPTED
Date: unknown

Decision: Mobile, web and backend retain independent Git histories and deployments.

Reason: Current workspace/remotes implement this split.

Consequences: Cross-surface releases require three checkpoints and contract verification.

Do not revisit unless: migration preserves deployability and history.

## DEC-002 — Razorpay is the web payment rail
Status: ACCEPTED
Date: 2026-09-02

Decision: Web subscriptions use Razorpay; entitlement reconciliation remains server-controlled.

Reason: Current web/backend code and handoff commits.

Consequences: Never trust client-only payment success.

Do not revisit unless: billing migration includes webhook and entitlement transitions.


## 22 November — public version-57 OTA boundary

Prepare report/navigation JavaScript from the actual public source and original
native dependencies. Reproduced fingerprints, rather than forced runtime strings,
establish compatibility. Keep original eas.json: even adding a QA build profile
changes its fingerprint. Preserve the public internal-release channel mapping.
The old XML config-plugin advisory is retained and documented; its audit gate is
not waived. Native worldwide builds carry the fully patched toolchain.
