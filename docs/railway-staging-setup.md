# Railway Staging Setup — Founder Checklist (~5 min)

Everything code-side for the staging gate (B5) is done and merged: the `staging`
branch exists, CI runs on it, `app.py` logs the resolved env + DB host at boot,
and `env_guard.py` refuses to start a `staging` process wired to the prod
Supabase project. The remaining steps are **dashboard actions only you can do**.

## 1. Create a separate staging Supabase project (NEVER prod data)
- Supabase dashboard → **New project** → `ari-staging` (same region: Singapore).
- Apply the schema: run the SQL from `supabase/migrations/*` against the new
  project (dashboard SQL editor, or `supabase db push` with the staging ref).
- **Do not** copy prod rows in. Seed with throwaway test data only.
- Copy from the staging project settings: `SUPABASE_URL`, anon key, service-role
  key, and the **pooler** connection string (`SUPABASE_DATABASE_URL`).

## 2. Create the Railway staging service
- Railway → the Ari backend project → **New service → GitHub repo**
  (`ejjy/ari-backend`).
- **Settings → Deploy → Branch = `staging`** (this is what makes it auto-deploy
  the staging branch, separate from the prod service on `master`).
- It reuses `railway.json` (same gunicorn start command) automatically.

## 3. Set the staging service's environment variables
Set these on the **staging service only** (do not touch the prod service):

```
APP_ENV=staging                         # <- the guard kerys on this
SECRET_KEY=<a NEW strong secret, not prod's>
GEMINI_API_KEY=<staging or same key>
SUPABASE_URL=https://<staging-ref>.supabase.co
SUPABASE_ANON_KEY=<staging anon key>
SUPABASE_SERVICE_ROLE_KEY=<staging service-role key>
SUPABASE_DATABASE_URL=<staging pooler URL>   # must NOT be the prod ref
SENTRY_DSN=<optional; a staging Sentry env is nice-to-have>
CORS_ORIGIN=*
```

> If you accidentally paste the prod `SUPABASE_DATABASE_URL` here, the service
> **will refuse to boot** with a clear error — that's the guard doing its job.
> Fix the URL to the staging project and redeploy.

## 4. Verify (2 min)
- Railway staging deploy logs should show:
  `[config] APP_ENV=staging db=postgresql://***@<staging-ref>.supabase.co:5432/postgres`
  — confirm the host is the **staging** ref, not `cazigdaoqeoqnqwajibf`.
- Hit the staging service URL `…/api/health` → `{"status":"healthy"}`.
- Register a throwaway account against staging from a dev build pointed at the
  staging API URL; confirm the row lands in the **staging** Supabase, not prod.

## 5. From now on
`feature → commit to staging → auto-deploy staging → verify → merge/push master`.
CI runs pytest on both branches. Schema changes go to the staging Supabase before
`staging` deploys and to prod before merging to `master`.

---

Once done, tell me and I'll treat the staging service as the default verify step
for future backend work.
