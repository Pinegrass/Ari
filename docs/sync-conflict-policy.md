# Sync Conflict Policy

**Scope:** Ari's offline-first transaction sync (`src/lib/syncEngine.ts` +
`src/lib/localStore.ts`). Sprint 2 shipped the engine; Sprint 4 (B6) hardened it
to ≥70% line coverage (now ~96%), added telemetry, and wrote down the policy the
code already enforces so it's auditable.

## Model

- The **client id (UUID v4) is canonical** (ID model A). A transaction has the
  same id on device and server for its whole life — the backend upserts on it.
- The device holds the source of truth for *unsynced* edits; the **server holds
  the source of truth for anything already acknowledged**.
- Each local row carries sync-control fields: `syncStatus`
  (`synced|pending|failed`), `op` (`create|update|delete`), `retryCount`,
  `updatedAt` (server-authoritative once synced).

## Queue drain order

`flushPending()` drains `getPending()` **oldest-first**, single-flight (one pass
at a time). Oldest-first guarantees a row's `create` is sent before any later
`update`/`delete` of the same row. Because the backend upserts on the id and
`DELETE` is idempotent, a row sent twice (the inline per-write flush racing the
background pass) lands exactly once — no dedupe needed.

## Conflict resolution — who wins

| Operation | Rule | Rationale |
|-----------|------|-----------|
| **create** | Client sends; server upserts on id. | New row — no server state to conflict with. |
| **update** | **Last-write-wins, server-authoritative on 409.** The client PUTs the `updatedAt` it edited from. If the server has moved past that baseline (another device / concurrent edit) it replies **409 + the current row**. The client then **overwrites local with the server's version and marks synced** — it does *not* re-push. | A monotonic loser (the stale edit) must not clobber a newer value or loop forever. The server copy is the reconciliation point. |
| **delete** | **Delete-wins, idempotent.** Tombstone is sent; a missing row is treated as already-deleted (success). | Deleting something already gone is not an error; intent was "gone." |

**Field granularity:** conflict resolution is **whole-row**, not per-field. On a
409 the client adopts every field of the server's `current` row (amount,
category, description, note, date). Ari transactions are small, single-user-owned
records; per-field merge would add complexity with no real-world payoff (two
devices editing the same transaction's *different* fields within a sync window is
vanishingly rare). If that changes, revisit here first.

**409 with no body:** if the server signals 409 but doesn't include `current`,
the client marks the row synced (accepts the server's implicit "I already have
this") rather than retry forever.

## Duplicate-suppression guarantees

- **Same id, sent twice → one row.** Backend upserts on the client id.
- **Recurring instances:** `recurringEngine` keys generated children on
  `parentRecurringId + date`; the same occurrence is never materialised twice
  (see `src/lib/recurringEngine.ts`).
- **Backlog creates carry `suppressAlerts: true`** so replaying an offline
  backlog doesn't fire stale budget/push notifications (G7).

## Failure handling & backoff

- **4xx (validation)** on a row → mark `failed`, **skip it, keep draining** the
  rest of the queue. It stays visible as `failed`.
- **5xx / network (status 0)** → mark `failed`, **stop the pass**; a later
  trigger retries. This preserves oldest-first ordering (don't skip ahead past a
  transient failure).
- **Give-up:** after `GIVE_UP_AFTER = 6` failed tries a row is no longer
  auto-retried (almost always a permanent 4xx) — it remains `failed` and
  surfaces in telemetry rather than hammering the server forever.
- **Retry cadence:** exponential backoff `2s → … → 5min` ceiling, ×0.2 random
  jitter so a reconnecting fleet doesn't thunder the server. Reset to 0 when the
  queue empties.
- **Triggers (JS-only, no NetInfo native dep):** app foreground (`AppState`
  `active`), a 60s safety interval, the backoff retry, plus DataContext's inline
  per-write opportunistic flush.

## Telemetry (B6 — making silent rot visible)

Emitted from `syncEngine.ts`:

- `track('sync_failed', { op, status })` + a Sentry breadcrumb on **every**
  failure.
- `track('sync_stuck', { op, status })` **and** a `captureError` to Sentry when a
  row exhausts its retries (`retryCount + 1 >= GIVE_UP_AFTER`) — this is the
  signal that a write is permanently wedged.
- `track('sync_queue_depth', { depth })` + breadcrumb whenever the pending depth
  **changes** (not every 60s tick — a healthy idle app stays quiet).

Dashboards: a rising `sync_queue_depth` that never returns to 0, or any
`sync_stuck`, means writes aren't landing — investigate before users notice
missing transactions.
