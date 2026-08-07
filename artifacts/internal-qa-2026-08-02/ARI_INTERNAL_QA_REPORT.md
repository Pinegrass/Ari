# Ari internal rollout QA — 3 August 2026

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
- Exposed the existing overall monthly budget API in the live Budget Planner route; the prior UI was unreachable.
- Added one safe retry for transient mobile-network failures on idempotent `GET`, `PUT`, `PATCH`, and `DELETE` requests; `POST` is deliberately never retried.
- Tightened Tomo's production prompt to answer first, stay under 80 words by default, follow requested formats, and remove praise/filler; retained enough Gemini output headroom to prevent truncated answers.
- Promoted Ari Accountant to the primary five-slot bottom navigation and moved Trends & Insights into the top of that toolkit; removed the duplicate Settings entry.

## Automated verification

| Gate | Result |
|---|---|
| Frontend Jest | **464/464 passed** (30 suites) |
| TypeScript | **PASS** |
| ESLint | **PASS — 0 errors** (17 pre-existing warnings) |
| Expo Doctor | **18/18 passed** |
| npm audit | **0 vulnerabilities** |
| Backend pytest | **185/185 passed** |
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
| Primary navigation | **FIXED / PASS** — Home · Accountant · Add · Tomo · More rendered on-device; Accountant opened directly without a back arrow and its Trends & Insights module opened the existing Trends screen |
| Home dashboard | **PASS** — daily/monthly totals and charts refreshed |
| Expense create | **PASS** — created labeled QA expense for ₹123 |
| Category and note | **PASS** — Food / `QA Internal Rollout Lunch` persisted |
| Trends | **PASS** — totals, chart, category insight and recent row reflected ₹123 |
| Delete and resync | **PASS** — QA expense deleted and all totals returned to ₹0 |
| Recurring transaction lifecycle | **PASS** — created a ₹321 monthly Food item, paused, resumed with next date advanced to 3 September, stopped the series, and verified ₹0 cleanup |
| Overall monthly budget | **FIXED / PASS** — set ₹10,000, rendered `₹10,000 left`, cleared it, and verified the empty CTA and clean account state |
| Tomo AI | **FIXED / PASS** — production reply completed in **6.3 s**, used the supplied ₹60,000/₹30,000 figures, and returned exactly three actions in **66 words** |
| Reminders | **PASS** — enabled at 8:00 PM; Android alarm registered for `com.pinegrass.ari` and notification channel is active |
| RevenueCat paywall failure handling | **FIXED / DEVICE PASS** — empty Play offering now renders `Ari Pro is not available from Google Play yet` instead of raw `Error 23` |
| Profile edit | **PASS** — changed `Ejaj Hassan` to `Ejaj Hassan QA` through the authenticated server flow, verified it in Settings, then restored the original name and verified it after a fresh launch |

Final preview OTA group `f10a97c1-17bd-4cdd-87e2-65eeec0da2c3` (Android update `019fc793-f0d7-792a-bb6b-17f4005d34bf`, iOS update `019fc793-f0d7-7460-834c-c34cea069651`) was published and applied on the connected device; production was not modified. Internal preview APK build `26205a37-d468-426b-94fd-9f10fe44d0f5` (version code 47) remained the native shell and preserved the signed-in session. A profile `PATCH` succeeded server-side while its response was lost during a radio transition; the new idempotent retry policy covers that case. The final restoration to `Ejaj Hassan` passed and was verified in Settings.

## Device performance

| Metric | Result |
|---|---|
| Cold launch samples | **1,368 ms**, then **1,057 ms** |
| Frames / modern jank | **1,331 / 23 (1.73%)** |
| Frame latency | p50 **11 ms**, p90 **17 ms**, p95 **21 ms**, p99 **53 ms** |
| Memory | **210,248 KB PSS**, **307,149 KB RSS** |
| Crash / ANR scan | **0** Ari crashes or ANRs |

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
