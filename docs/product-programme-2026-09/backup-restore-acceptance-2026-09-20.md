# Public/auth backup and isolated restore acceptance — 20 September 2026

Completed a read-only, consistent-snapshot backup of Ari's production Supabase `public` and `auth` schemas and data before the September 20 migrations. Existing Railway `SUPABASE_DATABASE_URL` credentials were read privately; no credentials, tokens or user rows were printed or committed. PostgreSQL `REPEATABLE READ READ ONLY`, an exported snapshot and `pg_dump --snapshot` kept the dump and source count manifest consistent.

## Evidence

- Private backup outside Git: `D:/Codex/Artifacts/Ari/restore-2026-09-20/public-auth.dump` (367,893 bytes).
- SHA-256: `778ee2ad918dbc0702d9fa7756abf5986e96bec342d4fd5b8e817cdac529390f`.
- Private manifest and `restore-result.json` are beside the backup; directory ACL restricted to the current Windows account, SYSTEM and Administrators.
- Restored using PostgreSQL 17 `pg_restore --exit-on-error --no-owner --no-privileges` into a dedicated local container with `--network none` and no published ports.
- All **26 public-table row counts matched**, totaling **1,809 rows**. The `auth.users` row count also matched the snapshot manifest; its count/identifiers are not published here.
- Restored public schema has **zero unvalidated foreign-key/check constraints** and **zero invalid indexes**. Data and post-data restore completed successfully, including constraint creation.
- Empty default `public` schema was removed before restore; local Supabase role names and `pgcrypto`/`uuid-ossp` extensions were created to satisfy dump dependencies. No source data was transformed.
- Dedicated `ari-restore-acceptance-20260920` container and its anonymous volume were removed after verification. The private backup and evidence remain available for rollback planning.

## Boundaries

This verifies logical recovery of the captured application/auth schemas in an isolated database. It does not verify managed Supabase PITR, infrastructure recovery, production restoration, complete role ownership/ACL restoration, Storage objects, Vault/root keys, migration-history schema, Edge Functions, external providers, or a running application's authentication flow against the restored database. Aggregate counts and restored constraints are evidence of data/integrity recovery, not byte-for-byte comparison of every row. No recovery-time SLA was measured.

No production writes, notifications, provider charges or devices were used. This closes the previously missing isolated backup/restore exercise for application data; the broader disaster-recovery and live operational gates retain these limits.

References checked: Supabase changelog and [Backup and Restore using the CLI](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore), including the separate treatment of migration history, ownership, auth/storage changes and encryption keys.
