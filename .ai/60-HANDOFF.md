# Latest handoff — backend deployed and Supabase verified

Owner authorised backend deployment. Backend `c05a77ffa07b3ccd6a1edde49b0678ec0f52000d` pushed to master and live on Railway deployment `14764053-885e-4299-a78b-8f17faf32068`. Status SUCCESS; /api/health returns exact revision and healthy.

Existing Ari Supabase project `cazigdaoqeoqnqwajibf` retained. No migration required. 28 authenticated live checks pass, including direct Supabase confirmation of paise persistence and planning midnight expiry. Synthetic account/profile/transactions removed and absence verified. Scoped HTTP500+ query returned no entries at verification time.

See `docs/product-programme-2026-09/backend-deployment-2026-09-12.md`. Mobile source5ba6d31 and webc10caca remain unpublished; no device testing. Backend prerequisite for mobile paise publication is satisfied. Play/payment/push/iOS gates unchanged. Prior backend a4014a8 is rollback reference; it rejects paise.
