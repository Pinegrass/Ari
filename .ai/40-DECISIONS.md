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
