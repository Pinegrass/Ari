# Backend spec — `DELETE /api/account`

Endpoint required for Google Play account-deletion policy compliance. Without this, the listing can be taken down.

## Contract

### Request

```
DELETE /api/account
Authorization: Bearer <access_token>
```

No body.

### Responses

**200 OK** — deletion accepted

```json
{
  "status": "scheduled",
  "completesAt": "2026-06-24T18:00:00Z"
}
```

- `status` is `"scheduled"` if data purge is async, `"completed"` if synchronous.
- `completesAt` is an ISO-8601 timestamp ≤ 30 days from now (Play policy).

**401 Unauthorized** — missing / expired token. Standard JSON error.

**404 Not Found** — user not found (already deleted). Treat as success on the client.

## Behavior the backend MUST implement

1. **Authenticate** the caller via the existing JWT middleware. Identify the user.
2. **Revoke all sessions** for this user — invalidate refresh tokens, kick all devices. This is non-negotiable: a deleted user must not be able to sign in again from any cached state.
3. **Mark the account as deleted** in the users table:
   - `deleted_at = now()` (or move to a `deleted_users` table — either is fine).
   - `email` should be either nulled or hashed to free it up for re-registration without leaking it.
4. **Schedule or perform the data purge.** Affected tables (audit before shipping):
   - `transactions` — hard delete
   - `budgets` — hard delete
   - `categories` (user-defined) — hard delete
   - `devices` / `push_tokens` — hard delete
   - `oauth_links` (Google etc.) — hard delete
   - `audit_log` — retain only the deletion event itself; anonymize others if they reference user_id
5. **Return** the response above.
6. **Async option** — if you can't do all of the above in-request, accept the request, enqueue a job, and return `"status": "scheduled"`. Job must complete within 30 days.

## Behavior the backend MUST NOT do

- Do **not** require the user to email support to delete. Play rejects listings that gate deletion behind a human.
- Do **not** require a password re-prompt on a Google-authenticated user — they don't have one. The fact that they hold a valid bearer token is sufficient proof of identity.
- Do **not** silently soft-delete with no purge plan. Play audits this.

## Edge cases worth handling

| Case | Behavior |
|---|---|
| User has active subscription | Cancel subscription, then delete. (Pinegrass team: not applicable unless billing exists.) |
| User has pending money transfers | Out of scope for current Ari; if added later, refuse deletion until settled and tell the user why. |
| User is the last admin of a shared workspace | Out of scope for current Ari. |
| Concurrent delete requests | Idempotent: second request returns 200 with the same `completesAt`. |

## Audit log

Insert one row into `audit_log` (or equivalent) BEFORE deleting the user record:

```
event:        account.deleted
user_id:      <id>
requested_at: <iso8601>
ip_address:   <request_ip>
user_agent:   <request_ua>
completes_at: <iso8601>
```

This is the only PII you should retain post-deletion, and it should be auto-purged on its own schedule (90 days is reasonable).

## Test plan

- [ ] Authenticated request → 200, returns valid `completesAt`.
- [ ] Re-using the access token after deletion → 401.
- [ ] Re-using the refresh token after deletion → 401.
- [ ] User attempts to sign in with same email after deletion → standard "no account found" path (do not say "this account was deleted" — that's a privacy leak).
- [ ] Re-registering with the same email post-deletion → succeeds, creates a fresh account with no data inherited.
- [ ] All listed tables verified to no longer reference the deleted `user_id` (run a fixture-based test against a copy of staging).

## Implementation note

If the backend is FastAPI / SQLAlchemy (which is consistent with the `routes/auth.py` hint from prior context), the simplest shape:

```python
@router.delete("/api/account", status_code=200)
async def delete_account(
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
):
    # 1. Revoke sessions
    await sessions_repo.revoke_all_for_user(db, user.id)
    # 2. Audit log
    await audit_repo.log(db, event="account.deleted", user_id=user.id, ...)
    # 3. Either perform purge inline (fine for small data) or enqueue
    await account_repo.purge_user(db, user.id)
    completes_at = datetime.utcnow().isoformat() + "Z"
    return {"status": "completed", "completesAt": completes_at}
```

For Pinegrass's likely scale (pre-launch), synchronous purge is fine.
