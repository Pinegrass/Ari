# Shared expense and settlement safety

Local code only; no payment app, provider, device or production data was used.

Group detail no longer offers cash as a fallback for an arbitrary network failure. Cash has a dedicated confirmation explaining it records money already paid and sends nothing. UPI opening is not payment evidence: the user must explicitly check their payment app, then the server must acknowledge the settlement record. Missing/ambiguous responses show a safe refresh message rather than success or raw provider text. Account/group changes discard old callbacks and responses; one mutation runs at a time.

The old member-level net payment could mark several gross splits settled despite reciprocal offsets. That action was removed. Net balances remain visible; payments are recorded against individual exact splits. Server UPI intents require the recorded group currency INR. A group has one immutable recorded currency (INR/USD/GBP/AUD); viewer/member profile currency changes never relabel amounts. This is single-currency group accounting, not foreign-exchange conversion.

Shared expense drafts now use a stable client UUID in the existing expense primary key. An ambiguous save retains and locks the submitted draft; retry sends the same UUID and payload. The backend serializes an owner's creates, acknowledges exact owned retries, rejects a changed payload/foreign owner ID, and validates finite amounts, cent precision, unique members and exact split totals. The displayed split cents match the submitted distribution. **Deploy this backend before this mobile client:** the older endpoint ignores the supplied UUID and cannot provide retry safety.

Settlement confirmation now verifies active group membership, the exact split's group and debtor ownership under a split lock. Repeated settlement returns the original confirmed record without changing its timestamp. Apply the generated additive migration `20260919183206_immutable_group_currency.sql` before this backend. Existing groups remain NULL (unknown); no profile-based historical backfill is performed. A database trigger prevents changing or clearing a known group currency, including through direct database APIs. Duplicate expense IDs remain protected while the original row exists; this is not a permanent deletion tombstone.

Group-detail and add-expense flows have EN/HI copy for failures, payment confirmation, records, form labels and retry. Loading failures offer retry/back instead of spinning indefinitely. Native language/accessibility and real UPI acceptance remain deferred.

Verification: 10 backend tests passed for idempotency, changed payload/owner conflicts, wrong-group/nonmember confirmation, repeated cash confirmation and malformed expenses. Six mobile interaction tests passed for ambiguous failure, no automatic UPI confirmation, stale-account cash confirmation and stable draft retries. Scoped lint and TypeScript checks passed. SQLite verifies behavior but does not establish PostgreSQL row-lock race acceptance; no real payment lifecycle is inferred from fixtures.


## Recorded currency confirmation and compatibility

New groups take the creator's supported account currency once. Existing unknown groups display that fact rather than an invented symbol. Adding expenses and recording settlements stay disabled until the active group creator chooses INR/USD/GBP/AUD and explicitly confirms that existing records use that unit. The confirmation explains that amounts are only labeled, never converted, and the unit cannot later be changed. The guarded endpoint only fills an unknown unit, acknowledges same-unit retries and rejects different-unit changes. Recorded expenses and balances expose the group unit; mobile uses it for formatting and preserves private-mode masking.

Expense and settlement requests carry the captured group currency. Unknown or mismatched/missing units receive 409; older clients must upgrade before writing group financial records. Existing reads remain available. No compatibility fallback silently interprets amounts using a changed profile currency. Coordinate migration, backend and client release; this intentional old-client write gate prevents incorrect financial records. Legacy group creators still need to verify their original records before confirming a unit.

The isolated PostgreSQL verifier `tests/verify_group_currency_postgres.py` runs the exact migration against a historical row and checks NULL preservation, supported units, immutable changes, retrying the same unit and trigger-function privilege denial. Root integration records its run result; this document does not infer execution from the presence of a test script.
