import * as Updates from 'expo-updates';
import { AppState, type AppStateStatus } from 'react-native';
import { addBreadcrumb } from '../config/sentry';
import { track } from './analytics';

export type OtaStatus =
  | 'idle'
  | 'checking'
  | 'available'
  | 'downloading'
  | 'staged'
  | 'uptodate'
  | 'error';

interface OtaState {
  status: OtaStatus;
  message: string;
}

// Whether a newer JS bundle has been downloaded and staged this session.
// Once true, the update is applied either eagerly the next time the app is
// backgrounded (see registerOtaReloadHandler) or on the next natural cold
// start (expo-updates launches staged updates automatically) — never
// mid-session, so an active user is not interrupted by a reload.
let updateStaged = false;

let currentState: OtaState = { status: 'idle', message: '' };
const listeners = new Set<(state: OtaState) => void>();

function setState(next: OtaState) {
  currentState = next;
  listeners.forEach((cb) => cb(next));
}

export function getOtaState(): OtaState {
  return currentState;
}

export function subscribeToOta(cb: (state: OtaState) => void): () => void {
  listeners.add(cb);
  cb(currentState);
  return () => listeners.delete(cb);
}

function isOtaEnabled(): boolean {
  return !__DEV__ && Updates.isEnabled;
}

/**
 * Cold-start OTA check. Fire-and-forget — never block the splash on this.
 *
 * Checks the configured EAS channel for a newer bundle matching this
 * runtimeVersion fingerprint; if one exists, downloads and stages it for the
 * next launch. Every failure path is a silent no-op: the app keeps running the
 * bundle it booted with. Relies on expo-updates' built-in auto-rollback to the
 * embedded bundle if a staged update crashes on launch (do not disable that).
 */
export async function checkAndApplyUpdate(): Promise<void> {
  // No OTA in dev (Expo Go / dev client) or when updates are disabled (e.g.
  // an embedded-only build). Updates.isEnabled is false in those cases and
  // checkForUpdateAsync would throw.
  if (!isOtaEnabled()) return;

  setState({ status: 'checking', message: 'Checking for updates…' });
  track('ota_check_started');

  try {
    const result = await Updates.checkForUpdateAsync();
    if (!result.isAvailable) {
      setState({ status: 'uptodate', message: 'Ari is up to date.' });
      track('ota_check_uptodate');
      return;
    }

    addBreadcrumb('ota', 'update available, fetching', 'info');
    setState({ status: 'downloading', message: 'Downloading update…' });
    track('ota_update_available', {
      runtime_version: Updates.runtimeVersion,
    });

    const fetched = await Updates.fetchUpdateAsync();
    if (fetched.isNew) {
      updateStaged = true;
      setState({
        status: 'staged',
        message: 'Update downloaded. It will apply the next time you close and reopen Ari.',
      });
      track('ota_update_staged');
      addBreadcrumb('ota', 'update fetched and staged for next launch', 'info');
    } else {
      setState({ status: 'uptodate', message: 'Ari is up to date.' });
    }
  } catch (err) {
    setState({ status: 'error', message: 'Could not check for updates right now.' });
    track('ota_check_failed', { error: err instanceof Error ? err.message : 'unknown' });
    addBreadcrumb('ota', `check/fetch failed: ${err}`, 'warning');
  }
}

/**
 * Manual check suitable for a "Check for updates" button. Returns the final
 * status so the UI can show a one-shot confirmation.
 */
export async function checkForUpdateManually(): Promise<OtaState> {
  if (!isOtaEnabled()) {
    const state: OtaState = {
      status: 'error',
      message: 'Updates are not available in this build.',
    };
    setState(state);
    return state;
  }
  await checkAndApplyUpdate();
  return currentState;
}

/**
 * Registers an AppState listener that applies a staged update by reloading
 * the moment the app goes to the background.
 *
 * This guarantees the user is never interrupted mid-session: by the time
 * reloadAsync runs they have already left the app, and they return to the
 * new bundle. If the app is killed before backgrounding, expo-updates applies
 * the staged update on the next cold launch anyway. Returns an unsubscribe
 * function (suitable as a useEffect cleanup).
 */
export function registerOtaReloadHandler(): () => void {
  const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
    if (next !== 'background' || !updateStaged) return;

    // Disarm first so repeated background transitions can't double-reload.
    updateStaged = false;
    addBreadcrumb('ota', 'applying staged update via reloadAsync', 'info');
    track('ota_update_applied');
    Updates.reloadAsync().catch(() => {
      // Reload failed (rare). The staged update still applies on the next cold
      // launch, so re-arm and let a later background transition retry.
      updateStaged = true;
    });
  });

  return () => sub.remove();
}

/**
 * Readable build info for the About / Settings screen.
 */
export async function getOtaMetadata(): Promise<{
  runtimeVersion: string | undefined;
  updateId: string | undefined;
  channel: string | undefined;
  isEmbeddedLaunch: boolean;
}> {
  return {
    runtimeVersion: Updates.runtimeVersion ?? undefined,
    updateId: Updates.updateId ?? undefined,
    channel: Updates.channel ?? undefined,
    isEmbeddedLaunch: Updates.isEmbeddedLaunch,
  };
}
