# Supabase helper hardening candidate — 19 September 2026

Status: local migration and isolated PostgreSQL verification only. No live database,
provider permission, Auth configuration or production function was changed.

The read-only live audit supplied by the root operator identified mutable search paths
and broadly executable helper functions. Canonical definitions and dependencies were
checked in root migrations `20260418000003_indexes_triggers.sql` and
`20260419000003_shared_expenses.sql`, plus later trigger uses. Source search found group
policies calling `is_group_member(group_id, auth.uid())`; there is no mobile/web direct
RPC dependency on arbitrary-user membership queries.

Prepared backend migration `20260919134713_harden_internal_helpers.sql`:

- Fixes the search path to empty for `touch_updated_at` and `handle_new_auth_user`.
  Existing trigger bodies use built-ins and an explicitly qualified profile table.
- Revokes direct PUBLIC/anon/authenticated execution of both trigger functions.
- Preserves `is_group_member(uuid,uuid)` and its authenticated policy use, but requires
  a non-null current `auth.uid()` matching the requested uid. It only queries that
  caller's active membership, using explicitly qualified objects and a fixed path.
- Retains SECURITY DEFINER on the membership helper to avoid recursive membership RLS,
  revokes PUBLIC/anon execution, and explicitly grants authenticated execution.

Verification script: `backend/tests/verify_helper_hardening_postgres.py PORT`.
Ran against a new dedicated PostgreSQL 16 Docker instance bound to loopback46289,
fixed synthetic-only credentials and empty database `ari_helper_fixture`; no app or
.env import. It executed canonical function definitions and the actual migration.
Checks passed: profile provisioning trigger after revocation; update trigger as the
restricted role; function privilege restrictions; own active group access through
RLS; membership-table RLS without recursion; arbitrary-other-user probe rejected;
nonmember sees no groups; absent auth identity cannot probe; fixed function paths.
The disposable container `ari-helper-hardening-20260919` was removed afterward.
Scoped Ruff passed. PostgreSQL16 synthetic evidence is not production Supabase17
acceptance; rerun advisors and reviewed migration verification on authorized release.

Relevant current guidance was inspected at
https://supabase.com/docs/guides/database/functions (fixed search paths and explicit
function execution grants), along with current Supabase changelog and API-security
guidance during this implementation session.

Remaining: Supabase leaked-password protection warning is provider configuration,
not fixed by this migration. No Auth settings change was authorized or performed.
Broader group join/write policies, actual backup restore, production advisor cleanup
and device/payment acceptance are not claimed complete by this bounded hardening.
