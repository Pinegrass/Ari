# Ari — Security Audit Sprint 2

**Scope:** Mobile client, Supabase auth/schema, Flask backend routes.
**Auditor:** Senior Dev, Pinegrass
**Date:** 2026-07-01
**Severity key:** Critical / High / Medium / Low

## Executive Summary

No critical vulnerabilities were found in the current codebase. The auth flow, secret handling, and Supabase RLS policies are aligned with standard practices. Medium-severity gaps are limited to input-sanitization hardening and documentation. Low-severity items are polish/hardening opportunities for future sprints.

## Findings

### 1. Client secrets — public-by-design keys are not hardcoded
**Severity:** Low (informational)
**Finding:** `EXPO_PUBLIC_SUPABASE_ANON_KEY`, PostHog project key, Sentry DSN, and Google web client ID are loaded from environment variables and bundled into the client. This is expected for these services; none are server-only secrets.
**Evidence:**
- `src/lib/supabase.ts` loads `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
- `src/lib/analytics.ts` loads `EXPO_PUBLIC_POSTHOG_HOST` and `EXPO_PUBLIC_POSTHOG_KEY`.
- `src/config/sentry.ts` loads `EXPO_PUBLIC_SENTRY_DSN`.
- `src/lib/socialAuth.ts` loads `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`.
**Fix:** No code change. Document in the privacy policy that the app connects to Supabase, PostHog, and Sentry. Ensure the Supabase project restricts the anon key to auth + RLS-governed data only (confirmed below).

### 2. Supabase RLS policies enforce user isolation
**Severity:** Low (informational)
**Finding:** All user-owned tables in `supabase/migrations/20260418000002_rls_policies.sql` have `ENABLE ROW LEVEL SECURITY` and policies that compare `auth.uid()` to `user_id`.
**Evidence:**
- `ari_users` policies restrict select/update to the matching UUID.
- `accounts`, `expenses`, `budgets`, `goals`, `tax_profiles`, `budget_rollovers`, `user_categories`, `todo_notes` all have select/insert/update/delete policies scoped to `auth.uid() = user_id`.
- `coaching_cache` is read-only/update-own; `coaching_audit` is insert-only from the client.
- `feedbacks` allows insert and select-own only.
**Fix:** No change required. Continue to rely on the Flask backend for cross-user/service-role operations.

### 3. JWT storage uses secure OS APIs
**Severity:** Low (informational)
**Finding:** The Supabase client is configured with `expo-secure-store` as the auth storage adapter, and the API client reads the token from the same secure store.
**Evidence:**
- `src/lib/supabase.ts` passes `secureStorage` to `createClient`.
- `src/lib/secureStorage.ts` (referenced) uses `expo-secure-store` with AsyncStorage fallback/migration.
- `src/api/client.ts` reads the token via `secureStorage.getItem('ari_token')`.
**Fix:** No change required. Consider enabling biometrics for app unlock (already partially implemented via `useBiometric`).

### 4. Backend transaction input validation can be tightened
**Severity:** Medium
**Finding:** The transaction create/update endpoints validated type, amount, date, and category but did not constrain `tags`, `recurrenceRule`, `incomeSource`, `merchant`, or text-field lengths.
**Evidence:**
- `backend/routes/transactions.py` previously accepted arbitrary tag arrays and long free-text fields.
**Fix applied:**
- Added `_normalize_tags`, `_validate_recurrence_rule`, and `_truncate_text` helpers.
- Tags limited to 20 items, 30 chars each.
- `description`/`note`/`raw_input` capped at 500 chars (description at 255).
- `incomeSource`/`merchant` capped at 100 chars.
- `recurrenceRule` validated against the allowed enum set.

### 5. API client refresh storm protection exists
**Severity:** Low (informational)
**Finding:** `apiRequest` has a single-in-flight token refresh via `_refreshInFlight` and skips refresh for credential-exchange routes.
**Evidence:** `src/api/client.ts` lines 29–60.
**Fix:** No change required.

### 6. No certificate pinning
**Severity:** Medium (future hardening)
**Finding:** The app does not pin SSL certificates for the API or Supabase endpoints. A sophisticated network attacker could theoretically MITM a device with a rogue root cert.
**Fix:** Not implemented in this sprint. Add to the backlog as a post-iOS-launch hardening item.

### 7. OTA update integrity is correctly versioned
**Severity:** Low (informational)
**Finding:** `expo-updates` uses `runtimeVersion: { policy: 'appVersion' }`, which means native-code changes (including the new chart library) require a matching native build and cannot be silently shipped as JS-only updates.
**Evidence:** `app.json` lines 75–77.
**Fix:** No change required. Document that v1.0.2 requires a native rebuild because `react-native-gifted-charts` and `react-native-svg` were added.

### 8. Tomo AI system prompt includes anti-injection guards
**Severity:** Low (informational)
**Finding:** The Gemini system prompt instructs the model to ignore instructions embedded in user financial context or chat history.
**Evidence:** `backend/routes/tomo.py` lines 266–268.
**Fix:** No change required. Continue monitoring for prompt-injection attempts via `coaching_audit`.

## Recommendations

1. **Short term (before iOS launch):**
   - Complete the privacy policy with the third-party services listed in Finding 1.
   - Verify the EAS production environment has only `EXPO_PUBLIC_*` vars and no server secrets.
   - Confirm `ios/Ari/PrivacyInfo.xcprivacy` is generated and committed after `npx expo prebuild`.

2. **Medium term (post-launch):**
   - Add SSL certificate pinning for the API domain.
   - Implement backend rate-limiting for `/auth/login` and `/auth/register` if not already present.
   - Review Supabase `auth.users` for any test accounts before production hardening.

3. **Long term:**
   - Conduct a formal penetration test before handling sensitive financial data at scale.
   - Add automated dependency scanning (`npm audit`, Snyk, or Dependabot) to CI.

## Verification Commands

```bash
# Ensure no hardcoded secrets in TypeScript source
grep -R "sk-\|secret\|password" src/ --include="*.ts" --include="*.tsx" || echo "No obvious secrets found"

# Check Python backend for raw credential strings
grep -R "API_KEY\|SECRET\|PASSWORD" backend/ --include="*.py" || echo "No obvious secrets found"

# Run backend smoke tests if available
cd backend && python -m pytest tests/ -q
```

## Conclusion

The app is in good security shape for an iOS App Store release. The only code changes made were non-breaking input-validation hardening in `backend/routes/transactions.py`. All other findings are documented controls or backlog items.
