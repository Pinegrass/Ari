# Planning confirmation and deletion retry protection

Local source implementation. No schema migration or production change.

Updated clients create one UUID per deliberate planning confirmation and send the snapshot revision they read. The backend serializes under the existing user lock. A retry of the same ID and exact payload returns the current status without updating confirmation time, ledger revision, inputs or analytics. Reusing an ID with different contents returns 409. A delayed old request after a newer snapshot also returns 409. Thus a lost response followed by a ledger edit cannot promote stale inputs to a fresh estimate.

Both client hooks retain the same ID for an unchanged failed request. Editing, successful completion, currency change or account switch discards it. A deliberate subsequent confirmation uses a new UUID. Conflicts require reloading the server revision while preserving the draft; they do not silently overwrite a newer plan. Transport retries reuse the already-serialized request body. UUID-generation failures are caught by the same save-error state.

Deletion uses its own UUID and expected revision. A retry cannot delete a newer confirmation. Even clearing an empty plan writes a minimal replay guard containing only a random revision and `_deleted=true`; it retains no financial inputs or ledger data. Reads report missing inputs, export reports `planning:null`, and daily planning reminders ignore the guard. A subsequent deliberate save uses that revision. Account deletion still deletes the row. The guard lasts for the account lifetime to prevent delayed requests from resurrecting deleted inputs.

Legacy clients without confirmation fields retain their prior contract; they do not gain the new retry guarantee. This compatibility limitation should inform rollout acceptance.

Deployment must precede updated clients. Older backend versions cannot interpret deletion guards or new confirmation fields, so rollback needs a compatible backend build and coordinated client version plan; do not blindly restore the previous backend or delete guard rows as an automatic workaround.

Verification: 39 focused backend planning/product/measurement tests passed, including four idempotency scenarios; deleted-plan reminder exclusion additionally passed. Eleven mobile planning tests passed, including lost-response identity reuse, deliberate reconfirmation, draft edits and account switching. Final whole-repository checks are recorded by the root orchestrator.
