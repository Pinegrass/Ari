# Backend deployment — 12 September 2026

Owner explicitly authorised backend deployment connected to Supabase.

- Source: `c05a77ffa07b3ccd6a1edde49b0678ec0f52000d` (Pinegrass/ari-backend master pushed; Railway Git deployment).
- Deployment: `14764053-885e-4299-a78b-8f17faf32068`, production service `web`, SUCCESS.
- Health: `https://web-production-7c65f.up.railway.app/api/health`, HTTP200, healthy, exact revision verified after live checks.
- Database: existing Ari Supabase project `cazigdaoqeoqnqwajibf`, ACTIVE_HEALTHY. Railway SUPABASE_DATABASE_URL targets this project through the Singapore pooler. Existing credentials retained; no database migration required. expenses.amount is numeric with scale2.
- RELEASE_REVISION updated to the exact commit without triggering a separate deployment. Railway pending deployment approved under owner deployment authorisation.

28 live checks pass: Supabase sign-in, authenticated API access, INR125.50 create →126.75 edit → list/summary/daily report, excess precision rejection, planning calculation/read and expiry at account-local midnight, delete flows. A service-role read directly from the named Supabase project confirmed the synthetic transaction written by Railway. Test account, app profile and entries were deleted and absence verified. Existing user data was not changed.

Post-check health remains healthy. Scoped deployment HTTP500+ log query returned no entries at verification time. This is a point-in-time smoke test, not extended monitoring.

Private machine evidence: `D:/Codex/Artifacts/Ari/backend-deploy-2026-09-12.json` and verification script alongside it. No credentials copied into repository or report. Local pre-deployment suite remains301passing from implementation.

Mobile/web fixes remain unpublished. No device interaction. Provider/payment/Play/push/iOS gates are unchanged. Backend dependency for publishing mobile paise support is now satisfied. Previous backend revision `a4014a860d8f6efd17df26f5d1d27e3efb53f717` remains the rollback reference; rolling back would again reject fractional INR, so coordinate any client rollout accordingly.
