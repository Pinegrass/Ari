# Account-owned bills and local scheduling — 20 September 2026

Implemented locally; no device tests, provider calls or release.

## Ownership and preservation

Bills now use an account-scoped storage key and notification namespace. A verified account restoration/login binds the owner; logout, rejected authentication and account transitions invalidate pending operations. Old asynchronous reads cannot return another account's bills; serialized writes keep their captured owner key and reject stale continuations. Scheduling finishing after a transition cancels its stale notification. Main navigation is keyed by user ID so prior account screen state is not reused.

The original `ari_bills` value has no trustworthy owner. It is preserved unchanged, quarantined from listing, scheduling, export and automatic adoption. Recovery requires independent owner identification; signing in as the next account is not evidence of ownership. No legacy data was deleted or silently reassigned. Offline cached identity alone does not unlock account-owned bills until server identity validation succeeds.

Bill notification payloads now contain only owner ID and bill ID. Taps must match the current owner and resolve a currently stored bill before navigation; arbitrary payload amounts/names and old unowned notifications cannot prefill an entry. Startup/account changes cancel stale bill notifications only. Cancellation remains best effort when the OS API fails; physical acceptance remains deferred.

Ordinary logout preserves each account's scoped bills. A confirmed backend account deletion explicitly removes that owner's scoped bill key/reminders while preserving other accounts and the unattributed legacy quarantine. Failed/uncertain server deletion never purges local data. Local cleanup failure after confirmed server deletion is reported separately rather than falsely reporting server deletion failure or automatically retrying it.

Deletion uses a dedicated fixed-endpoint helper with no automatic replay. On a parsed authoritative success it runs captured-owner cleanup before applying the normal stale-session response guard, so a server-triggered signout cannot skip cleanup. Response data still cannot escape into another account; stale Settings callbacks do not display old-account success or log out the replacement account. A bound bill owner must match the request account before any deletion request. Authoritative signout clears React/cache identity as well as request state.

## Calendar behavior

Live bill due-date display, upcoming selection, one-time-date creation and reminders explicitly use the device IANA timezone. Nine AM wall time remains nine AM across DST changes. Legacy IST helpers/defaults remain available for callers deliberately using that contract. These device bill reminders remain separate from server notification settings/caps; no combined three-per-day claim is made.

## Export

The JSON export combines server account records and a strict current-device owned-bill snapshot. It checks the captured account/session revision, server profile and local owner before combining them. Account switches, missing owner or local read corruption fail the export instead of returning a misleading empty local list. The UI and machine-readable scope explicitly exclude unassigned legacy bills, other devices and unsynced transactions; server/device reads are not an atomic shared snapshot. English/Hindi copy replaces the incorrect claim that all data stays on the device and explains exported files contain financial information.

## Verification

Local tests cover ownership across logout/relogin, legacy preservation, stale reads/schedules, scoped deletion, rejected/uncertain server deletion, account-switch exports, strict export failures, auth binding, existing bill/calendar behavior, DST transitions, half-hour zones and local month boundaries. Final focused totals and integrated checks are recorded by the root completion report. No production/device acceptance is inferred from these fixtures.


## Final storage and notification failure review

Bill save/delete now use strict reads: unavailable storage, malformed JSON or a non-array value cannot be treated as an empty bill collection and overwritten. The bills screen requests strict retrieval and displays a safe EN/HI error; delete failure is handled without an unhandled promise. Existing dashboard convenience reads remain best effort. Unassigned legacy storage is unchanged.

Generic local check-in initialization catches storage/platform errors and ignores unmounted or obsolete account results. Interactive enable/disable/time changes report localized failure, avoid false success on permission/capability/cancellation failures, and reject nonfinite times. Failed enable persistence and partially scheduled reminders trigger cancellation of known generic IDs only. Cancellation waits for all native attempts before releasing the schedule queue. Stale housekeeping cannot cancel the replacement account's schedules. Test reminders recheck permission and captured account state; a native request finishing after account change is canceled if still pending. An already delivered OS notification cannot be recalled by this mechanism.

Authenticated server capability ownership remains authoritative for generic scheduling; unavailable ownership suppresses scheduling rather than guessing. Existing account preferences, bill reminder IDs, and server daily/outbox rollout gates remain separate. OS cancellation can itself fail; the app reports interactive failure and best-effort lifecycle housekeeping does not claim delivery or cancellation verification.

Malformed/truncated HTTP success bodies from account deletion remain uncertain: no replay, no local purge, and a safe deletion-not-confirmed message. Parsed server success is the authoritative cleanup trigger. Tests explicitly cover this distinction.


Startup response subscription now contains native lookup/teardown failures and rejects late responses after disposal. Bill navigation also rechecks disposal after asynchronous lookup. A cold-start bill tap waits in memory for at most 30 seconds if the navigator is ready before verified bill account binding; matching verified owner resolves the stored bill, while logout/null binding, another owner, disposal or expiry drops the tap. No notification tap is persisted for later interactive-login replay. Focused bill/subscription verification: 35 tests passed. This verifies routing logic only, not actual OS notification delivery.


Integration follow-up: provider INITIAL_SESSION/TOKEN_REFRESHED while bills remain unbound now preserves a matching startup wait without granting bill access. A different restored owner discards the wait; explicit login/switch/logout still invalidate it. The pending-tap → initial-session → backend-validation sequence and owner-mismatch sequence are covered alongside Auth wiring. Focused bill/Auth suite: 42 tests passed.
