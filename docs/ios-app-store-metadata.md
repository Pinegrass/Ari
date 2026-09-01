# Ari — iOS App Store Metadata

> Prepared for the v1.3.0 TestFlight candidate. Apple signing must be configured
> before the first iOS production build.

## App Information

| Field | Value |
|-------|-------|
| App Name | Ari |
| Subtitle | Track, budget & save smarter |
| Bundle ID | com.pinegrass.ari |
| Primary Category | Finance |
| Secondary Category | Lifestyle |
| Age Rating | 4+ |

## Keywords (100 chars max)

```
budget,expense,tracker,money,finance,india,savings,spender,account,wealth
```

## Description

**Ari is your personal money coach.** Built for Indian earners, Ari makes tracking every rupee feel effortless — from a quick chai spend to monthly salary splits.

**What you can do:**
- Log expenses and income in seconds with a keypad-first, no-decimal entry flow.
- See what you spent today, this month, and where your money goes with beautiful charts.
- Chat with Tomo, your AI finance coach, for personalized budget tips and saving ideas.
- Set budgets, track savings goals, and estimate Indian taxes (FY 2025–26).
- Stay on top of recurring bills and shared expenses.

**Why Ari?**
- Designed for Indian finance: ₹ formatting, HRA/80C/80D tax logic, and local categories.
- Works offline-first: your entries save instantly and sync when you're back online.
- Private by default: your data is tied to your account and protected by industry-standard security.

Start building better money habits today.

## What's New (v1.3.0)

- Daily, weekly, and monthly visual money reports.
- Helpful check-ins that make it easier to return after time away.
- Invite links and friend-circle milestones.
- Improved coaching, recurring-payment controls, and budget planning.
- Reliability, accessibility, and privacy improvements throughout Ari.

## Support & Marketing URLs

- Support URL: `https://aritomo.in/support`
- Marketing URL: `https://aritomo.in`
- Privacy Policy URL: `https://aritomo.in/privacy`

## Screenshot Requirements

Prepare screenshots for the following device sizes:

1. **iPhone 6.7" Display** (e.g., iPhone 15 Pro Max) — required
2. **iPhone 6.5" Display** (e.g., iPhone 14 Pro Max) — required
3. **iPhone 5.5" Display** (e.g., iPhone 8 Plus) — required
4. **iPad Pro 6th Gen 12.9"** — optional (supportsTablet is false, so not needed)

### Recommended screenshot flow (5 per device)

1. Dashboard — greeting, "Spent today" hero, monthly chart.
2. Add Entry — keypad-first expense logging.
3. Trends — income vs. expenses line chart + category breakdown.
4. Tomo — AI coach chat with a sample question.
5. Budgets / Savings Goals — progress and planning.

### Screenshot specs

- Format: PNG or JPG
- No transparency (JPG preferred)
- No status bar in screenshots (use simulator clean status bar or tools like screenshotwizard)
- Dimensions:
  - 6.7": 1290 × 2796 px
  - 6.5": 1284 × 2778 px
  - 5.5": 1242 × 2208 px

## App Review Information

- **First name / Last name:** *(founder to fill)*
- **Email:** *(founder to fill)*
- **Phone:** *(founder to fill)*
- **Demo account:**
  - Email: `demo@ari.app`
  - Password: `demo123`
- **Notes for reviewer:**
  - The app uses Supabase for authentication and a Flask backend for financial data.
  - Voice input uses the device microphone with user permission.
  - Biometric unlock is optional and uses Face ID / Touch ID with a permission prompt.
  - No in-app purchases are active in v1.0.2 (paywall feature is gated off).

## Privacy Manifest Checklist

Expo SDK 57 generates the base `PrivacyInfo.xcprivacy` during `expo prebuild`. Verify the following required reason APIs are declared:

| API Category | Used By | Required Reason |
|--------------|---------|-----------------|
| NSPrivacyAccessedAPICategoryFileTimestamp | expo-file-system / expo-updates | C617.1 (process info in memory) |
| NSPrivacyAccessedAPICategoryDiskSpace | expo-updates | E174.1 (free disk space) |
| NSPrivacyAccessedAPICategorySystemBootTime | expo-updates | 35F9.1 (measure time) |
| NSPrivacyAccessedAPICategoryUserDefaults | expo-secure-store / AsyncStorage | CA92.1 (user defaults) |

After `npx expo prebuild -p ios`, inspect:
```
ios/Ari/PrivacyInfo.xcprivacy
```
Ensure the file is present and committed before EAS build.

## Build & TestFlight Commands

```bash
# Prebuild iOS project (generates PrivacyInfo.xcprivacy)
npx expo prebuild -p ios

# Run on a local iOS simulator (requires macOS + Xcode)
npx expo run:ios

# Build the App Store-signed binary used by TestFlight
npx eas build --platform ios --profile production

# Submit that binary to App Store Connect / TestFlight
npx eas submit --platform ios --profile internal --latest
```

## HIG Compliance Notes

- Minimum touch target: 44×44 pt across all interactive elements.
- Status bar text remains readable due to safe-area insets and cream/forest contrast.
- Modal presentations use bottom-sheet style with clear dismiss affordances.
- App currently ships the approved light paper theme through `userInterfaceStyle: "light"`.

## First TestFlight blockers

- Configure an Apple distribution certificate and provisioning profiles for
  `com.pinegrass.ari` and `com.pinegrass.ari.share-extension` in EAS.
- Configure an App Store Connect API key (App Manager role recommended).
- Record the Apple Team ID and publish
  `https://aritomo.in/.well-known/apple-app-site-association` for invite links.
- Confirm the App Store Connect privacy answers and reviewer contact details.
