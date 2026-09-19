# Latest handoff — cohort reporting scope

Cold start verified all three Git states. No changes since root76d1635, backendd9575bd and web9eeb356. Existing S1 PostgreSQL acceptance evidence inspected without rerunning; device/provider acceptance remains pending. No devices, provider calls, deployments, pushes or notification gate changes.

S6: backend fa5b393082ab4b051e8c67ba00c0d82e5e7815ae adds explicit population and completed-local-day scope to the reference cohort report, exact exclusive/inclusive activation bounds and an unavailable marker for product-wide active users. Existing active count keys/calculations remain unchanged. Older activated users with recent activity are outside the reference cohort; they must not be silently represented as overall WAU/MAU. A mixed old/exact-boundary/included fixture verifies the distinction. Independent bounded review found no blocker; full343 backend tests, scoped Ruff F/E9 and diff check pass.

This is local, unpublished reference code, not production analytics. Storage/consent epochs/ingestion/export/expiry and product-wide reporting remain pending. Retry identity after90-day deletion and activation provenance still need coherent lifecycle semantics before schema. Contract wording clarified to separate reference cohort counts from product-wide reporting.

Web local9eeb356 unchanged. Live artifacts remain last recorded backendb855630/web7a1533f/Android internaldfdaec1, not reverified this turn. Device hold, iPhone deferral, disabled daily/outbox sends and payment/distribution blockers persist. No sprint marked accepted by this increment.
