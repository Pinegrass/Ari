# Ari internal rollout QA — 2 August 2026

## Decision

**Code and core product: PASS. Play monetisation: HOLD.**

Ari is stable enough for continued internal rollout, but the next Play update must not be promoted to production until a Google Play subscription product is attached to RevenueCat's `default` offering and a Play-installed purchase/restore cycle passes. No AAB was built or uploaded during this audit.

## Changes made

- Added an authenticated profile-name editor to Settings, backed by the existing `PATCH /auth/me` flow.
- Patched Expo and Expo Updates to the current SDK 54 patch releases.
- Cleared all npm audit findings with scoped transitive dependency overrides.
- Corrected negative monthly cash flow from the misleading label `Saved` to `Deficit` on Home and Trends.
- Added a RevenueCat offering preflight so an empty Google Play offering shows a clear in-app explanation instead of RevenueCat's opaque `Error 23` dialog.
- Enabled `EXPO_PUBLIC_PAYWALL_ENABLED=true` in the EAS production environment.

## Automated verification

| Gate | Result |
|---|---|
| Frontend Jest | **458/458 passed** (30 suites) |
| TypeScript | **PASS** |
| ESLint | **PASS — 0 errors** (17 pre-existing warnings) |
| Expo Doctor | **18/18 passed** |
| npm audit | **0 vulnerabilities** |
| Backend pytest | **184/184 passed** |
| Live backend health | **200**, `{"status":"healthy"}` |
| Anonymous billing reconcile | **401**, authentication boundary enforced |
| Railway RevenueCat secret | **HOLD** — `REVENUECAT_SECRET_API_KEY` is absent |
| Railway Redis | **ADVISORY** — `REDIS_URL` is absent; fallback works but multi-worker quotas are loose |

## Android / store compliance

| Requirement | Evidence | Result |
|---|---|---|
| Target SDK | Installed QA artifact reports `targetSdk=36` | **PASS** |
| Google Play Billing | RevenueCat Android 10.13.0 resolves Billing Library **8.3.0** | **PASS** |
| 16 KB pages | `zipalign -c -P 16 -v 4` on installed APK: `Verification successful` | **PASS** |
| OTA | Preview update downloaded on the connected device, displayed the apply-on-reopen notice, and loaded after a cold restart | **PASS** |
| Versioning | Internal APK build version **47**, app/runtime **1.2.0** | **PASS** |

## Connected-device verification

Device: Samsung Android handset `R9ZY6046FML`.

| Flow | Result |
|---|---|
| Existing authenticated session and cold launch | **PASS** — account loaded as Ejaj Hassan |
| Home dashboard | **PASS** — daily/monthly totals and charts refreshed |
| Expense create | **PASS** — created labeled QA expense for ₹123 |
| Category and note | **PASS** — Food / `QA Internal Rollout Lunch` persisted |
| Trends | **PASS** — totals, chart, category insight and recent row reflected ₹123 |
| Delete and resync | **PASS** — QA expense deleted and all totals returned to ₹0 |
| Tomo AI | **PASS** — live budgeting prompt returned coherent 50/30/20 arithmetic, used only supplied figures, no account-data fabrication |
| Reminders | **PASS** — enabled at 8:00 PM; Android alarm registered for `com.pinegrass.ari` and notification channel is active |
| RevenueCat paywall failure handling | **FIXED / DEVICE PASS** — empty Play offering now renders `Ari Pro is not available from Google Play yet` instead of raw `Error 23` |
| Profile edit | **PASS** — changed `Ejaj Hassan` to `Ejaj Hassan QA` through the authenticated server flow, verified it in Settings, then restored the original name and verified it after a fresh launch |

Preview OTA group `719c2f6d-2f3b-4bb4-8dff-c4e180cb4b05` was published for Android and iOS from commit `8786ce7`; production was not modified. Internal preview APK build `26205a37-d468-426b-94fd-9f10fe44d0f5` (version code 47) installed successfully over the existing app while preserving the signed-in session. The first restoration request during the reversible profile test hit a transient connection error; the retry succeeded, and the original name was confirmed after force-stop and relaunch.

Screenshots and raw device captures are in `artifacts/internal-qa-2026-08-02/screenshots/`.

## RevenueCat / Play Console finding

- RevenueCat project: **Ari Finance**.
- Android app is registered as `com.pinegrass.ari`.
- The `default` offering has Monthly, Yearly and Lifetime packages, but all three are **Test Store** products.
- The Ari Finance Play Store product list in RevenueCat is empty; the public Android API consequently returns an offering with zero purchasable packages.
- Play Console's Subscriptions page currently requests a new billing-enabled artifact before it allows subscription setup. Per launch instruction, no AAB was generated or uploaded in this audit.

Required promotion gate after approval to build:

1. Upload the reviewed AAB to Play internal testing.
2. Create/import the intended Ari subscription SKU and base plan in Play Console.
3. Import it into RevenueCat, attach it to the `Ari Finance Pro` entitlement and the `default` package.
4. Add the RevenueCat secret API key to Railway as `REVENUECAT_SECRET_API_KEY`.
5. Install Ari from the Play internal-test link and pass purchase, cancel, restore and backend reconcile tests.

## Final classification

- Core finance product, AI, authentication/session, profile, reminders, OTA and Android binary compliance: **QUALIFIED**.
- Google Play paywall and real purchase path: **NOT YET QUALIFIED** because the store product does not exist/attach yet.
- Production promotion recommendation: **HOLD until the four monetisation gates above pass.**
