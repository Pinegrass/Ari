import 'react-native-gesture-handler';
import React, { useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import * as Linking from 'expo-linking';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  Fraunces_400Regular,
  Fraunces_500Medium,
  Fraunces_600SemiBold,
  Fraunces_700Bold,
} from '@expo-google-fonts/fraunces';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Sentry from '@sentry/react-native';
import { initSentry } from './src/config/sentry';
import { initSslPinning } from './src/lib/sslPinning';
import * as Notifications from 'expo-notifications';
import { initAnalytics, track } from './src/lib/analytics';
import { checkAndApplyUpdate, registerOtaReloadHandler } from './src/lib/otaUpdates';
import { reconcileBillReminders, type BillNotificationData } from './src/lib/bills';
import ErrorBoundary from './src/components/ErrorBoundary';
import UpdateToast from './src/components/UpdateToast';
import { AuthProvider } from './src/context/AuthContext';
import { DataProvider } from './src/context/DataContext';
import { PrivacyProvider } from './src/context/PrivacyContext';
import { ThemeProvider } from './src/context/ThemeContext';
import RootNavigator from './src/navigation/RootNavigator';
import { useShareIntent } from 'expo-share-intent';
import { getInitialSharedText, addShareIntentListener, sharedTextFromIntent } from './src/lib/shareIntentHandler';
import type { RootStackParamList } from './src/navigation/navigationTypes';

const navigationRef = createNavigationContainerRef<RootStackParamList>();

// Pending share text buffered before the navigator is ready. Drained in onReady.
let _pendingShareText: string | null = null;
// Pending bill-reminder tap buffered before the navigator is ready.
let _pendingBillPrefill: BillNotificationData | null = null;

/** A bill reminder was tapped — open fast entry with the bill prefilled. */
function navigateToBillEntry(data: BillNotificationData) {
  if (!navigationRef.isReady()) {
    _pendingBillPrefill = data;
    return;
  }
  try {
    (navigationRef as any).navigate('Main', {
      screen: 'AddTransaction',
      params: {
        type: 'expense',
        prefill: { amount: data.amount, description: data.name, category: data.category },
      },
    });
    track('bill_reminder_opened', {});
  } catch {
    // Navigator on Auth (logged out) — drop silently.
  }
}

/** Pull a bill payload out of a notification response, or null if it isn't one. */
function billDataFromResponse(response: Notifications.NotificationResponse | null): BillNotificationData | null {
  const data = response?.notification?.request?.content?.data as { type?: string } | undefined;
  if (data && data.type === 'bill_reminder') return data as unknown as BillNotificationData;
  return null;
}

/** Widget tap (ari://add) — open fast entry. Buffered until the nav is ready. */
let _pendingOpenAdd = false;
function navigateToAdd() {
  if (!navigationRef.isReady()) {
    _pendingOpenAdd = true;
    return;
  }
  try {
    (navigationRef as any).navigate('Main', {
      screen: 'AddTransaction',
      params: { type: 'expense' },
    });
  } catch {
    // Navigator on Auth (logged out) — drop silently.
  }
}

function navigateToShare(text: string) {
  if (!navigationRef.isReady()) {
    // Navigator not mounted yet — buffer and drain once it's ready.
    _pendingShareText = text;
    return;
  }
  try {
    // Navigate into the nested Main stack. Works only when user is logged in;
    // silently ignored if Auth is the active root (share intent is dropped on
    // unauthenticated cold-start — acceptable MVP behaviour).
    (navigationRef as any).navigate('Main', {
      screen: 'ShareCapture',
      params: { text },
    });
  } catch {
    // Navigator not on Main (e.g. still on Auth) — drop silently.
  }
}

// Initialize Sentry + PostHog early so the very first render can fire events.
// `app_opened` here represents a true cold start (process boot). Warm
// foregrounding is tracked separately via the AppState listener below.
initSentry();

initAnalytics().then(() => track('app_opened', { source: 'cold' }));

// Fire-and-forget OTA check on cold start. Never blocks the splash: if a newer
// JS bundle exists it's downloaded in the background and applied when the app
// is next backgrounded (see registerOtaReloadHandler) or on the next cold
// launch. All failures are silent no-ops.
checkAndApplyUpdate();

// Re-derive bill/EMI reminders from persisted bills on every cold start. Local
// notifications don't survive a reinstall or an OS purge, so reconciling here
// (idempotent: cancel-then-reschedule) is what makes reminders durable.
reconcileBillReminders();

function App() {
  // Forest-on-cream design system uses Fraunces (display) + Inter (body).
  // Gate first render until both are ready so no Text flashes in the system
  // font. Hooks below must still run unconditionally — the early return sits
  // after every hook to respect the rules of hooks.
  const [fontsLoaded] = useFonts({
    Fraunces_400Regular,
    Fraunces_500Medium,
    Fraunces_600SemiBold,
    Fraunces_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  // SSL pinning is initialized inside a useEffect (not at module level) so the
  // ErrorBoundary + native splash are already visible before the native module
  // loads. We gate the subtree that makes authenticated API calls (AuthProvider
  // calls /auth/me on mount) until pinning resolves, eliminating the race where
  // the first API request goes out before the pinning interceptor is installed.
  const [pinningReady, setPinningReady] = useState(false);

  // Tracks the wall-clock time spent in the foreground for the current
  // session. Reset on every transition into 'active'. Used to compute
  // `foreground_duration_sec` on backgrounding — the input to D1/D7
  // engagement cohorts and push-open attribution.
  const foregroundedAtRef = useRef<number>(Date.now());
  const backgroundedAtRef = useRef<number | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  // Android share-sheet (ACTION_SEND text/plain) delivery. expo-share-intent's
  // native module surfaces the shared text/url that expo-linking cannot see;
  // the hook manages cold + warm start. We route it through the same
  // navigateToShare path as the ari://share deep link below.
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntent({
    resetOnBackground: true,
  });

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      const prev = appStateRef.current;
      appStateRef.current = next;

      // background → active : warm foreground. This is the event that
      // separates "user came back" from "user installed". We deliberately
      // do NOT fire app_opened again — `source` is the dimension that
      // distinguishes cold vs warm in PostHog dashboards.
      if (next === 'active' && (prev === 'background' || prev === 'inactive')) {
        // Phantom-event guard. iOS fires 'inactive' for Face ID prompts,
        // control-center swipes, and notification glances — sometimes
        // without ever transitioning to 'background'. Without this guard
        // every such interruption produces a spurious app_foregrounded
        // with background_duration_sec=null. Only fire if we actually
        // observed the matching active→background transition.
        if (backgroundedAtRef.current === null) return;

        const backgroundDurationSec = Math.round(
          (Date.now() - backgroundedAtRef.current) / 1000
        );
        backgroundedAtRef.current = null;
        foregroundedAtRef.current = Date.now();
        track('app_foregrounded', {
          background_duration_sec: backgroundDurationSec,
        });
        // Reconcile bill reminders on resume too, so a monthly bill whose
        // occurrence just fired gets its next month scheduled without waiting
        // for a cold start.
        reconcileBillReminders();
      }

      // active → background : measure session length. iOS fires 'inactive'
      // briefly during control-center swipe — we only commit on actual
      // background to avoid noisy short sessions polluting the histogram.
      if (next === 'background' && prev === 'active') {
        const foregroundDurationSec = Math.round(
          (Date.now() - foregroundedAtRef.current) / 1000
        );
        backgroundedAtRef.current = Date.now();
        track('app_backgrounded', {
          foreground_duration_sec: foregroundDurationSec,
        });
      }
    });

    return () => sub.remove();
  }, []);

  // Certificate pinning is installed after React mounts so the ErrorBoundary +
  // native splash are already shown before the native module initializes. If the
  // SSL pinning module crashes iOS on first boot (rare: broken native module or
  // New Architecture incompatibility), the user sees the splash — not a white
  // flash. initSslPinning is fail-open on JS errors, but native SIGSEGV can't be
  // caught by a JS try-catch, so deferring past mount is a defense-in-depth.
  // The pinned hosts (Railway, Supabase) aren't contacted until the user logs in.
  useEffect(() => {
    initSslPinning().finally(() => setPinningReady(true));
  }, []);

  // Apply a staged OTA update when the app goes to background, so an active
  // user is never interrupted mid-session by a reload.
  useEffect(() => registerOtaReloadHandler(), []);

  // Bill reminders: when the user taps a reminder, open fast entry prefilled.
  // Cold-start taps (app launched by the notification) are read once; warm taps
  // come through the response listener.
  useEffect(() => {
    Notifications.getLastNotificationResponseAsync().then((response) => {
      const data = billDataFromResponse(response);
      if (data) navigateToBillEntry(data);
    });
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = billDataFromResponse(response);
      if (data) navigateToBillEntry(data);
    });
    return () => sub.remove();
  }, []);

  // Share-intent: receive text/plain shared from other apps (e.g. bank SMS).
  // Cold-start: the initial URL is checked once after mount.
  // Warm-start: the Linking listener fires for subsequent shares.
  // Requires the intentFilters in app.json + a new native build to activate the
  // Android share sheet entry; the JS-side handler is OTA-safe.
  useEffect(() => {
    getInitialSharedText().then((text) => {
      if (text) navigateToShare(text);
    });
    const sub = addShareIntentListener(navigateToShare);
    return () => sub.remove();
  }, []);

  // Route an incoming Android share-sheet payload to the capture screen, then
  // clear it so a re-render / resume doesn't replay the same share.
  useEffect(() => {
    if (!hasShareIntent) return;
    const text = sharedTextFromIntent(shareIntent);
    if (text) navigateToShare(text);
    resetShareIntent();
  }, [hasShareIntent, shareIntent, resetShareIntent]);

  // Widget deep link: ari://add (home-screen widget tap) opens fast entry.
  useEffect(() => {
    const handle = (url: string | null) => {
      if (url && url.startsWith('ari://add')) navigateToAdd();
    };
    Linking.getInitialURL().then(handle).catch(() => {});
    const sub = Linking.addEventListener('url', ({ url }) => handle(url));
    return () => sub.remove();
  }, []);

  // Native splash stays up until fonts resolve and SSL pinning interceptor is
  // installed. Fonts gate avoids a FOUT; pinning gate prevents AuthProvider's
  // /auth/me call from racing the interceptor install.
  if (!fontsLoaded || !pinningReady) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <SafeAreaProvider>
          <NavigationContainer
            ref={navigationRef}
            onReady={() => {
              if (_pendingShareText) {
                navigateToShare(_pendingShareText);
                _pendingShareText = null;
              }
              if (_pendingBillPrefill) {
                navigateToBillEntry(_pendingBillPrefill);
                _pendingBillPrefill = null;
              }
              if (_pendingOpenAdd) {
                navigateToAdd();
                _pendingOpenAdd = false;
              }
            }}
          >
            <ThemeProvider>
              <AuthProvider>
                <DataProvider>
                  <PrivacyProvider>
                    <StatusBar style="dark" />
                    <RootNavigator />
                    <UpdateToast />
                  </PrivacyProvider>
                </DataProvider>
              </AuthProvider>
            </ThemeProvider>
          </NavigationContainer>
        </SafeAreaProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}

export default Sentry.wrap(App);
