# Authentication and Tomo Pilot Release Gate

This checklist applies before increasing a Google Play staged rollout or
submitting a replacement iOS/Android binary.

## Boundaries

- Do not send email addresses, tokens, OAuth callback URLs, raw provider
  messages, transaction amounts, merchants, or categories to PostHog.
- Keep Play rollout percentage unchanged until both platform checks pass.
- Use a Play-signed install for Android OAuth certification. A local or EAS
  preview APK has a different signing identity.

## Google authentication device matrix

Test both a returning Google account and a Google account that has never used
Ari.

### iOS / TestFlight

1. Tap **Continue with Google**.
2. Complete Google's browser consent flow without dismissing it.
3. Confirm Ari reopens through `ari://auth/callback`.
4. Confirm Dashboard loads and `/api/auth/me` succeeds.
5. Verify the stage sequence in PostHog:
   `button_tapped → configuration → provider_picker → provider_callback →
   supabase_exchange → session_persisted → profile_fetch`.

### Android / Google Play signed install

1. Install from the Play internal/production track; do not sideload an APK.
2. Clear prior Ari app data before the fresh-account test.
3. Complete the native Google account picker.
4. Confirm Dashboard loads and `/api/auth/me` succeeds.
5. Verify the stage sequence in PostHog:
   `button_tapped → configuration → play_services → provider_picker →
   provider_callback → supabase_exchange → session_persisted → profile_fetch`.

If Android reports `developer_error`, re-check the Play App Signing SHA-1 and
package `com.pinegrass.ari` against the Android OAuth client in Google Cloud.

## Authentication pass criteria

- Fresh and returning Google accounts pass on both platforms.
- `login_success.provider` is `google` for each successful test.
- No unexplained failed or missing stage appears in the corresponding attempt.
- No token, email, raw URL, or raw provider message appears in analytics.

## Tomo contextual pilot

The first pilot uses the `contextual_v1` variant and measures:

- `nudge_presented`
- `nudge_opened`
- `nudge_action_started`
- `nudge_action_completed`
- `nudge_dismissed`
- `nudge_checkins_enabled` / `nudge_checkins_disabled`

The primary outcome is a completed financially meaningful action, not a push
open. Review results only after the event pipeline has enough real users to
support a comparison. Until then, use tester interviews and inspect individual
stage sequences without drawing retention-rate conclusions.

## Rollout decision

Expand Android beyond the current staged percentage only when authentication
passes, crash/error monitoring is stable, and no privacy regression is found.
Start a new store build only after that decision is recorded.
