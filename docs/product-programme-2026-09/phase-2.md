# Phase 2 — updates inbox and push receipts

11 September 2026. Implemented locally in the three canonical repositories. No commit, push, deployment, remote migration, native build, real notification or purchase was performed by this phase. The separate release task's artifacts do not include these changes.

## Result

- Mobile has a Tomo updates entry on Home and a dedicated inbox. Web has an updates tab. Both load generic, privacy-preserving cards in the selected English/Hindi interface language, handle empty/loading/error states, allow retry, and wait for server confirmation before removing a dismissed update.
- Weekly/monthly update cards open their historical report using the server's period and end-date anchor. Other cards direct users toward recorded entries or recurring payments where available. The existing API enforces user ownership and notification preferences; disabled categories are filtered before the result limit. This inbox surfaces existing coaching records, not a new source of forecasts or a complete notification history.
- Backend stores Expo ticket IDs and a hash of the token used for that send. A scheduler-authenticated receipt endpoint processes bounded batches with PostgreSQL row locks. It waits at least 15 minutes, paces receipt checks, expires unresolved outcomes after 24 hours, and distinguishes accepted, provider-delivered, receipt-failed and unknown outcomes. It never retries the notification send. Terminal receipt metadata is cleared; event deduplication identity remains.
- A late DeviceNotRegistered failure clears the device token only when it still matches the token used for that send. Immediate push failures use the same protection. Provider-delivered means handoff to Apple/Google, not proof that a device displayed or a person read the notification. This follows [Expo receipt guidance](https://docs.expo.dev/push-notifications/sending-notifications/).
- The scheduled workflow includes a receipt check twice an hour. This is local configuration only; it is not active in production. Migration `backend/supabase/migrations/20260911145248_push_receipts.sql` must precede deployment of the new model/worker.
- Hindi coverage expanded through Accountant, bills and recurring-payment controls, plus the new inbox. The legacy-copy migration script now avoids handlers, call arguments, object values and predicates after review caught a translated navigation identifier; that identifier was corrected. User-entered descriptions and program route keys remain unchanged. Complete Hindi coverage and human review are still outstanding.

## Verification

The final check results are recorded in [validation](validation.md). Added mobile interaction tests exercise report routing, failure/retry and confirmed dismissal; backend tests exercise historical routing metadata, language selection, ownership, receipt success, dead-token rotation, unknown outcomes, provider failure pacing and scheduler authentication. Web contract tests cover language and dismissal request/error propagation.

Applied both notification migrations twice in a disposable PostgreSQL 16 container with no network, published port or production volume. Verified all three receipt columns, pending index, retained RLS/client privilege restrictions, duplicate rejection and cascading deletion. Stopped and automatically removed the container. SQLite unit tests do not establish PostgreSQL worker-concurrency behavior under load.

The first mobile run exposed an asynchronous test press issue; awaited presses resolved it. Its cold render also exceeded Jest's default five-second timeout during concurrent checks; the suite uses the existing report-test convention of 20 seconds. These changes do not substitute for device performance measurement.

No new phase-2 browser visual or physical-device verification is claimed. Phase-1 browser evidence remains in validation.md; its later preview reconnect was blocked. No live Expo receipt or full staging browser/API flow was exercised.

## Remaining implementation and release sequence

1. Add a durable scheduling/outbox design for nudges suppressed during quiet hours; current policy suppresses rather than reschedules. Design bounded retries only for known-unsent work, never ambiguous sends. Add retention cleanup and production worker-concurrency validation.
2. Complete the highest-use Hindi forms, dynamic date fragments, validation/errors and accessibility labels; obtain native-language review and test Devanagari layout/font scaling on devices. The static string inventory is a phase-1 snapshot, not a current completion percentage.
3. Exercise the new schema, API contracts, receipt worker and mobile/web inboxes together on isolated staging, including account changes, disabled categories, offline reconnect and token rotation. Check actual Apple/Google outcomes without calling provider handoff device delivery.
4. Continue confirmed-payday/obligation data design and consented measurement pipeline. No affordability claim can be derived solely from recorded cash flow.
5. Record separate commits in all affected repositories and follow their release workflows only when release is authorized. Commercial proposals still require owner review; no price, trial, entitlement or payment-provider migration was implemented.

Baseline HEADs at this checkpoint: mobile `5ee13d35c41142680a4cae3c062c9ae2f4279585`; backend `1d5ba6bb8eb02da05fbbd910db36d7bbdc563bfe`; web `7d11e4f5d28a6defed8613a15123044a5c6e1663`. Programme edits remain uncommitted. Mobile HEAD advanced independently with iOS release configuration/dependency fixes, which this phase preserved.
