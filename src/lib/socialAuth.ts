/**
 * Google sign-in via the native SDK on Android and Supabase browser OAuth on iOS.
 *
 * Why @react-native-google-signin/google-signin and not expo-auth-session:
 *   - Android OAuth clients block custom-URI redirects by default (security
 *     hardening 2022+). We hit "Custom URI scheme is not enabled" with the
 *     web-flow path even after the GCP toggle.
 *   - Android's native SDK uses Google Play Services' system account picker —
 *     no custom URIs, no browser handoff, faster UX, Google's recommended
 *     long-term path.
 *   - The shipped iOS build has Ari's app URL scheme but not Google's reversed
 *     client scheme, so iOS returns through ari://auth/callback.
 *
 * Configuration:
 *   - WEB OAuth client (created in GCP) — its id is what the SDK passes
 *     to Google to receive a signed id_token. Configure once at app boot.
 *   - ANDROID OAuth client — its SHA-1 + package binding tells Google to
 *     trust requests originating from this signed APK. Doesn't appear in
 *     code; Google enforces it server-side.
 *
 * Contract: same as before — on success we persist the Supabase session's
 * access_token to SecureStore under 'ari_token' so the existing apiRequest +
 * Flask dual-path JWT verifier keep working unchanged.
 */
import {
  GoogleSignin,
  statusCodes,
  isErrorWithCode,
  isSuccessResponse,
} from '@react-native-google-signin/google-signin';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { isSupabaseConfigured, supabase } from './supabase';
import { secureStorage } from './secureStorage';
import { addBreadcrumb, captureError, Sentry } from '../config/sentry';
import {
  sanitizeAuthErrorCode,
  trackAuthAttempt,
  trackAuthResult,
  type AuthFlow,
  type AuthStage,
} from './authTelemetry';


let _configured = false;
const GOOGLE_TEMPORARY_ERROR =
  'Google sign-in is temporarily unavailable. Please use your email and password, or try again later.';
const ARI_IOS_OAUTH_REDIRECT = 'ari://auth/callback';

type OAuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export function parseOAuthTokens(url: string): OAuthTokens {
  const parsed = new URL(url);
  if (`${parsed.protocol}//${parsed.host}${parsed.pathname}` !== ARI_IOS_OAUTH_REDIRECT) {
    const error = new Error('Unexpected OAuth callback.');
    error.name = 'callback_mismatch';
    throw error;
  }
  const params = new URLSearchParams(parsed.search);
  const hashParams = new URLSearchParams(parsed.hash.replace(/^#/, ''));
  const error = hashParams.get('error_description') ?? params.get('error_description');
  if (error) {
    const providerError = new Error('Google returned an OAuth error.');
    providerError.name = 'callback_provider_error';
    throw providerError;
  }

  const accessToken = hashParams.get('access_token') ?? params.get('access_token');
  const refreshToken = hashParams.get('refresh_token') ?? params.get('refresh_token');
  if (!accessToken || !refreshToken) {
    const incomplete = new Error('Google did not return a complete session.');
    incomplete.name = 'callback_incomplete_session';
    throw incomplete;
  }
  return { accessToken, refreshToken };
}

function authFlow(): AuthFlow {
  return Platform.OS === 'ios' ? 'browser' : 'native';
}

function authResult(
  stage: AuthStage,
  outcome: 'success' | 'failed' | 'cancelled',
  errorCode?: string,
): void {
  trackAuthResult({ provider: 'google', flow: authFlow(), stage, outcome, errorCode });
}

async function signInWithGoogleOnIOS(): Promise<GoogleAuthResult> {
  trackAuthAttempt({ provider: 'google', flow: 'browser', stage: 'configuration' });
  if (!isSupabaseConfigured()) {
    authResult('configuration', 'failed', 'not_configured');
    return { ok: false, error: 'Google sign-in is not configured for this build.' };
  }
  authResult('configuration', 'success');

  try {
    trackAuthAttempt({ provider: 'google', flow: 'browser', stage: 'provider_picker' });
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: ARI_IOS_OAUTH_REDIRECT,
        skipBrowserRedirect: true,
      },
    });
    if (error || !data.url) {
      authResult('provider_picker', 'failed', 'provider_error');
      throw error ?? new Error('Google did not return an authorization URL.');
    }
    authResult('provider_picker', 'success');

    const result = await WebBrowser.openAuthSessionAsync(data.url, ARI_IOS_OAUTH_REDIRECT);
    if (result.type !== 'success') {
      authResult('provider_callback', 'cancelled', 'provider_cancelled');
      return { ok: false, cancelled: true };
    }

    let tokens: OAuthTokens;
    try {
      tokens = parseOAuthTokens(result.url);
      authResult('provider_callback', 'success');
    } catch (error) {
      authResult(
        'provider_callback',
        'failed',
        error instanceof Error ? error.name : 'provider_error',
      );
      throw error;
    }

    trackAuthAttempt({ provider: 'google', flow: 'browser', stage: 'supabase_exchange' });
    const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
    });
    if (sessionError || !sessionData.session) {
      authResult('supabase_exchange', 'failed', 'supabase_exchange_failed');
      throw sessionError ?? new Error('Supabase did not create a session.');
    }
    authResult('supabase_exchange', 'success');
    try {
      await secureStorage.setItem('ari_token', sessionData.session.access_token);
    } catch {
      authResult('session_persisted', 'failed', 'session_persist_failed');
      const persistError = new Error('Session storage failed.');
      persistError.name = 'session_persist_failed';
      throw persistError;
    }
    authResult('session_persisted', 'success');
    addBreadcrumb('auth', 'google: iOS browser session adopted');
    return { ok: true };
  } catch (e) {
    captureError(e instanceof Error ? e : new Error('google_ios_oauth_failed'), {
      where: 'socialAuth.signInWithGoogleOnIOS',
    });
    return { ok: false, error: GOOGLE_TEMPORARY_ERROR };
  }
}

function _ensureConfigured(): boolean {
  if (_configured) return true;
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  if (!webClientId) return false;
  try {
    GoogleSignin.configure({
      webClientId,
      // No iosClientId yet — iOS sign-in needs its own GCP client; defer.
      offlineAccess: false,  // we don't need a refresh token; Supabase issues its own
      forceCodeForRefreshToken: false,
    });
    _configured = true;
  } catch {
    /* swallow — surfaces as ok=false in signIn() */
  }
  return _configured;
}


export interface GoogleAuthResult {
  ok: boolean;
  error?: string;
  cancelled?: boolean;
}


export async function signInWithGoogle(): Promise<GoogleAuthResult> {
  if (Platform.OS === 'ios') return signInWithGoogleOnIOS();

  trackAuthAttempt({ provider: 'google', flow: 'native', stage: 'configuration' });
  if (!_ensureConfigured()) {
    authResult('configuration', 'failed', 'not_configured');
    Sentry.captureMessage('google_sign_in_not_configured', { level: 'error' });
    return { ok: false, error: 'Google sign-in is not available on this build. Please use your email and password.' };
  }
  authResult('configuration', 'success');

  // Make sure Play Services is available + up to date.
  try {
    trackAuthAttempt({ provider: 'google', flow: 'native', stage: 'play_services' });
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  } catch {
    authResult('play_services', 'failed', 'play_services_unavailable');
    return { ok: false, error: 'Google Play Services is missing or out of date on this device.' };
  }
  authResult('play_services', 'success');

  let response;
  try {
    trackAuthAttempt({ provider: 'google', flow: 'native', stage: 'provider_picker' });
    response = await GoogleSignin.signIn();
  } catch (e) {
    if (isErrorWithCode(e)) {
      switch (e.code) {
        case statusCodes.SIGN_IN_CANCELLED:
        case statusCodes.IN_PROGRESS:
          authResult('provider_picker', 'cancelled', 'provider_cancelled');
          return { ok: false, cancelled: true };
        case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
          authResult('provider_picker', 'failed', 'play_services_unavailable');
          return { ok: false, error: 'Google Play Services is missing or out of date on this device.' };
        case statusCodes.SIGN_IN_REQUIRED:
          authResult('provider_picker', 'failed', 'sign_in_required');
          return { ok: false, error: 'Please sign in to your Google account on this device first, then try again.' };
        default: {
          // DEVELOPER_ERROR ("code 10") is the famous SHA-1 / OAuth-client
          // misconfig path. Never leak the raw code to the user — it just
          // confuses people. Fingerprint via Sentry so we can spot it in
          // aggregate.
          Sentry.captureMessage(
            `google_sign_in_failed:${String(e.code)}`,
            { level: 'error', extra: { code: e.code, message: e.message } },
          );
          authResult('provider_picker', 'failed', sanitizeAuthErrorCode(String(e.code)));
          return { ok: false, error: GOOGLE_TEMPORARY_ERROR };
        }
      }
    }
    captureError(e instanceof Error ? e : new Error('google_sign_in_unknown'), {
      where: 'socialAuth.signIn',
    });
    authResult('provider_picker', 'failed', 'unknown_error');
    return { ok: false, error: 'Google sign-in failed. Please try again or use your email.' };
  }

  if (!isSuccessResponse(response)) {
    authResult('provider_picker', 'cancelled', 'provider_cancelled');
    return { ok: false, cancelled: true };
  }
  authResult('provider_picker', 'success');

  let idToken = response.data?.idToken;
  if (!idToken) {
    try {
      const tokens = await GoogleSignin.getTokens();
      idToken = tokens.idToken;
    } catch (e) {
      Sentry.captureMessage('google_sign_in_get_tokens_failed', {
        level: 'error',
        extra: {
          message: e instanceof Error ? e.message : String(e),
        },
      });
    }
  }

  if (!idToken) {
    Sentry.captureMessage('google_sign_in_no_id_token', { level: 'error' });
    authResult('provider_callback', 'failed', 'provider_error');
    return { ok: false, error: GOOGLE_TEMPORARY_ERROR };
  }
  authResult('provider_callback', 'success');

  // Hand off to Supabase — this is the same call we used before. The
  // session that lands here is what powers autoRefreshToken; AuthContext's
  // onAuthStateChange hook mirrors the refreshed access_token into
  // 'ari_token' so apiRequest keeps working past the initial 1h window.
  try {
    trackAuthAttempt({ provider: 'google', flow: 'native', stage: 'supabase_exchange' });
    addBreadcrumb('auth', 'google: exchanging id_token with Supabase');
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
    });
    if (error || !data.session) {
      Sentry.captureMessage('supabase_google_exchange_failed', {
        level: 'error',
        extra: { message: error?.message },
      });
      authResult('supabase_exchange', 'failed', 'supabase_exchange_failed');
      return { ok: false, error: 'Sign-in failed. Please try again or use your email.' };
    }
    authResult('supabase_exchange', 'success');
    try {
      await secureStorage.setItem('ari_token', data.session.access_token);
    } catch {
      authResult('session_persisted', 'failed', 'session_persist_failed');
      const persistError = new Error('Session storage failed.');
      persistError.name = 'session_persist_failed';
      throw persistError;
    }
    authResult('session_persisted', 'success');
    addBreadcrumb('auth', 'google: session adopted');
    return { ok: true };
  } catch (e) {
    captureError(e instanceof Error ? e : new Error('supabase_exchange_threw'), {
      where: 'socialAuth.signInWithIdToken',
    });
    if (!(e instanceof Error && e.name === 'session_persist_failed')) {
      authResult('supabase_exchange', 'failed', 'supabase_exchange_failed');
    }
    return { ok: false, error: 'Sign-in failed. Please try again or use your email.' };
  }
}


/**
 * Hook shim — kept so LoginScreen's import surface doesn't change.
 * The native SDK doesn't need a hook (no React state to track), so this
 * just returns the function.
 */
export function useGoogleSignIn(): {
  ready: boolean;
  signIn: () => Promise<GoogleAuthResult>;
} {
  return {
    ready: Platform.OS === 'ios' ? isSupabaseConfigured() : _ensureConfigured(),
    signIn: signInWithGoogle,
  };
}


/** Sign out of Google locally so the next signIn re-prompts the picker. */
export async function signOutGoogle(): Promise<void> {
  if (!_configured) return;
  try {
    await GoogleSignin.signOut();
  } catch {
    /* noop */
  }
}


// Phone OTP was here. Removed for v1 launch — email + Google cover the
// signup paths. Bring back via supabase.auth.signInWithOtp + verifyOtp
// when Twilio is provisioned and we're ready for the SMS cost model.
