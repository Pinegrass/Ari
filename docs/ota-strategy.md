# Ari — OTA Update Strategy

> Last updated: 2026-07-01
> Goal: enable frequent, safe JS-only updates via EAS Update while ensuring native-incompatible changes always require a store release.

## How OTA works in Ari

- `expo-updates` is installed and configured in `app.json`.
- Runtime version policy is **`fingerprint`**.
  - Expo computes a hash of the native code, config plugins, and `app.json` native settings.
  - If only JS/TS files change, the fingerprint stays the same → OTA update is allowed.
  - If native dependencies, plugins, or native config change, the fingerprint changes → a new store build is required.
- EAS Update channel is tied to the build profile:
  - `production` builds listen to the `production` channel.
  - `preview` builds listen to the `preview` channel.
  - `development` builds do not use OTA (they load from the dev server).

## What can be pushed OTA

Safe to ship with `eas update`:

- Screen/components/JS logic changes
- Styling, copy, colors, animation tweaks
- API endpoint paths or payload shapes (as long as the backend already supports them)
- Analytics events
- Navigation changes
- Bug fixes that don't touch native modules

## What requires a new native build

Do **not** try to OTA these; they change the runtime fingerprint:

- Adding/removing/upgrading native modules (`react-native-*`, Expo modules)
- Changing `app.json` plugins, permissions, or native infoPlist values
- Modifying `eas.json` build config
- Changing `react-native.config.js` or native project files
- Updating the minimum OS version or supported architectures

## Release workflow

### Normal JS-only hotfix

```bash
# 1. Make your JS-only changes.
# 2. Test locally.
npm run typecheck
npm run lint
npm test

# 3. Publish to the production channel.
npx eas update --branch production --message "Fix Trends chart label overlap"
```

### Release that includes native changes

```bash
# 1. Bump the app version in app.json / package.json.
# 2. Run checks.
npm run typecheck
npm run lint
npm test

# 3. Build production binaries.
npx eas build --platform android --profile production
npx eas build --platform ios --profile production

# 4. Upload to Play Console / App Store Connect and roll out gradually.
# 5. After the build is live, future JS fixes on this version can use:
#    npx eas update --branch production --message "Hotfix"
```

## Build profiles and channels

See `eas.json`:

| Profile | Channel | Use case |
|---------|---------|----------|
| `development` | none | Local dev / dev client |
| `preview` | `preview` | Internal testing / QA |
| `production` | `production` | Play Store / App Store |

## In-app behavior

- On every cold start, the app checks for an OTA update in the background.
- On every foreground, the app re-checks if not already checking/downloading.
- When an update is downloaded, a toast informs the user.
- The update is applied when the app is backgrounded via `Updates.reloadAsync()`.
- If the app is killed before backgrounding, the staged update applies automatically on the next cold launch.
- Users can manually check from **Settings → About → Check for updates**.

## Safety mechanisms

- `fingerprint` runtime version prevents incompatible OTA bundles from being served to old native builds.
- `expo-updates` has built-in rollback: if a staged update crashes on launch, the app reverts to the embedded bundle.
- All OTA check/fetch failures are silent; the app continues running the current bundle.
- Analytics events (`ota_*`) are tracked for monitoring.

## Monitoring

Useful PostHog events:

- `ota_check_started`
- `ota_check_uptodate`
- `ota_update_available`
- `ota_update_staged`
- `ota_update_applied`
- `ota_check_failed`

Build a dashboard to watch:
- Adoption rate of new updates
- `ota_check_failed` rate (network or config issues)
- Crash rate after `ota_update_applied`

## Gotchas

- **`__DEV__` and dev clients:** OTA is disabled in development and dev-client builds.
- **iOS App Store:** OTA updates are allowed, but the app must still pass review on the embedded bundle.
- **New permissions:** Adding a permission string to `app.json` is a native change and requires a store build, even though the string itself lives in JSON.
- **Runtime version mismatch:** If you see `ota_check_failed` spikes, verify the channel and runtime version match between the build and the update.

## Commands reference

```bash
# Check dependency alignment
npx expo install --check

# Preview what an update would publish
npx eas update --branch preview --message "Test OTA" --non-interactive

# Promote a preview update to production
# (Not directly supported; republish the same commit to production branch)
npx eas update --branch production --message "Promote preview build"

# View update channels
npx eas channel:list

# View update groups
npx eas update:list
```
