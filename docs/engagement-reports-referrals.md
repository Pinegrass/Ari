# Engagement, reports, and referral system

## Product principles

- Retention comes from useful financial feedback, not guilt, loss framing, or artificial streak threats.
- Reactivation is opt-in through the existing notification setting, contains no financial amounts, and is capped to one message at each 3, 7, 14, and 30-day inactivity stage.
- Reports are deterministic and remain available if both AI providers are unavailable.
- Referral attribution is explicit. A new or existing account applies one code once; sharing alone never counts as an accepted invite and does not reveal either user's financial data.
- The current circle milestones are recognition only. Do not attach cash, subscription, or financial rewards without adding fraud controls, reversal handling, and updated terms.

## Shipped flow

1. Authenticated API use updates `last_active_at` at most once every six hours.
2. `GET /api/engagement/summary` classifies the user as new, engaged, cooling, or dormant and returns a useful next action plus entry milestones.
3. The daily reactivation job checks inactive users and sends only the next eligible lifecycle message.
4. `GET /api/reports/periodic` returns daily, rolling seven-day, or month-to-date totals, prior-period comparisons, timelines, categories, goals, and a deterministic highlight.
5. Each user receives a unique invite code. Share attempts and accepted codes are measured separately.
6. `ari://invite/CODE` and `https://aritomo.in/invite?code=CODE` route to registration for logged-out users and the invite screen for logged-in users.

## Release order

1. Apply `supabase/migrations/20260901000001_engagement_referrals.sql` before deploying the backend. The ORM selects these columns on every user lookup.
2. Deploy the backend and confirm `/api/health`.
3. Add the GitHub Actions `SCHEDULER_TOKEN` secret if it is not present, and confirm the daily `reactivation` invocation succeeds.
4. Publish the website association files below before relying on HTTPS invite links.
5. Produce a new native build because associated domains and Android intent filters are native configuration. The report/referral screens themselves remain OTA-compatible after that build baseline exists.
6. Test push permission, 3/7/14/30-day staging with a dedicated test user, cold/warm invite links, code redemption, and notification opt-out on physical Android and iOS devices.

## Website association requirements

Host this JSON with `application/json` at `https://aritomo.in/.well-known/assetlinks.json`, replacing the fingerprint with the Play signing SHA-256 certificate fingerprint:

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.pinegrass.ari",
      "sha256_cert_fingerprints": ["REPLACE_WITH_PLAY_SIGNING_SHA256"]
    }
  }
]
```

Host this JSON without redirects at `https://aritomo.in/.well-known/apple-app-site-association`, replacing the team ID:

```json
{
  "applinks": {
    "details": [
      {
        "appIDs": ["REPLACE_TEAM_ID.com.pinegrass.ari"],
        "components": [{ "/": "/invite/*" }]
      }
    ]
  }
}
```

The invite landing page should preserve the code visibly and explain where to enter it after installation. Deferred deep-link attribution across a first install is not claimed by this implementation.

## Measurement

Track these without raw financial amounts:

- Activation: first transaction within 24 hours of registration.
- Retention: D1, D7, and D30 return rate, segmented by lifecycle state and report use.
- Report value: report views, period selected, and subsequent meaningful action.
- Reactivation: push accepted, push opened, and meaningful action within 24 hours, by stage.
- Referral loop: shares per inviter, accepted invites per inviter, share-to-accept rate, and invitee D7 retention.
- Guardrails: notification disable rate, account deletion rate after pushes, invalid/self/repeat redemption attempts, and crash-free sessions on report screens.

## Research basis

- Expo's SDK 57 notifications documentation supports routing notification data to a specific React Navigation destination and requires explicit permission plus a device push token.
- Expo's sending guidance recommends processing push receipts and clearing invalid tokens. Ari clears `DeviceNotRegistered` when it appears in the immediate ticket; receipt polling remains a production-hardening follow-up.
- Apple Universal Links require both the app entitlement and a website-hosted `apple-app-site-association` file. HTTPS links fall back to the website when the app is absent.
- Android App Links similarly require a verified website association, which is why the landing page and association file are release requirements rather than an OTA-only change.

Primary references:

- https://docs.expo.dev/versions/v57.0.0/sdk/notifications/
- https://docs.expo.dev/push-notifications/sending-notifications/
- https://docs.expo.dev/linking/into-your-app/
- https://developer.apple.com/documentation/xcode/allowing-apps-and-websites-to-link-to-your-content
