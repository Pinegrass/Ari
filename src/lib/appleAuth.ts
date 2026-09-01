import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { isSupabaseConfigured, supabase } from './supabase';
import { secureStorage } from './secureStorage';
import { addBreadcrumb, captureError, Sentry } from '../config/sentry';
import { trackAuthAttempt, trackAuthResult, type AuthStage } from './authTelemetry';

export interface AppleAuthResult {
  ok: boolean;
  error?: string;
  cancelled?: boolean;
}

function appleErrorCode(error: unknown): string | undefined {
  return typeof error === 'object' && error !== null && 'code' in error
    ? String((error as { code?: unknown }).code)
    : undefined;
}

function nameParts(fullName: AppleAuthentication.AppleAuthenticationFullName | null): string[] {
  if (!fullName) return [];
  return [fullName.givenName, fullName.middleName, fullName.familyName]
    .filter((part): part is string => Boolean(part?.trim()))
    .map((part) => part.trim());
}

function appleResult(
  stage: AuthStage,
  outcome: 'success' | 'failed' | 'cancelled',
  errorCode?: string,
): void {
  trackAuthResult({
    provider: 'apple',
    flow: 'native',
    stage,
    outcome,
    errorCode,
  });
}

export async function isAppleSignInAvailable(): Promise<boolean> {
  if (Platform.OS !== 'ios') return false;
  try {
    return await AppleAuthentication.isAvailableAsync();
  } catch {
    return false;
  }
}

export async function signInWithApple(): Promise<AppleAuthResult> {
  trackAuthAttempt({ provider: 'apple', flow: 'native', stage: 'configuration' });
  if (!isSupabaseConfigured()) {
    appleResult('configuration', 'failed', 'not_configured');
    return { ok: false, error: 'Apple sign-in is not configured for this build.' };
  }
  if (!(await isAppleSignInAvailable())) {
    appleResult('configuration', 'failed', 'provider_error');
    return { ok: false, error: 'Apple sign-in is not available on this device.' };
  }
  appleResult('configuration', 'success');

  trackAuthAttempt({ provider: 'apple', flow: 'native', stage: 'provider_picker' });
  let credential: AppleAuthentication.AppleAuthenticationCredential;
  try {
    addBreadcrumb('auth', 'apple: native sign-in starting');
    credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
    appleResult('provider_picker', 'success');
  } catch (error) {
    if (appleErrorCode(error) === 'ERR_REQUEST_CANCELED') {
      appleResult('provider_picker', 'cancelled', 'provider_cancelled');
      return { ok: false, cancelled: true };
    }
    appleResult('provider_picker', 'failed', 'provider_error');
    captureError(error instanceof Error ? error : new Error('apple_sign_in_unknown'), {
      where: 'appleAuth.signInWithApple',
    });
    return { ok: false, error: 'Apple sign-in failed. Please try again or use your email.' };
  }

  trackAuthAttempt({ provider: 'apple', flow: 'native', stage: 'provider_callback' });
  if (!credential.identityToken) {
    appleResult('provider_callback', 'failed', 'provider_error');
    return { ok: false, error: 'Apple sign-in failed. Please try again or use your email.' };
  }
  appleResult('provider_callback', 'success');

  trackAuthAttempt({ provider: 'apple', flow: 'native', stage: 'supabase_exchange' });
  let session: { access_token: string };
  try {
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
    });
    if (error || !data.session) {
      Sentry.captureMessage('supabase_apple_exchange_failed', {
        level: 'error',
        extra: { message: error?.message },
      });
      appleResult('supabase_exchange', 'failed', 'supabase_exchange_failed');
      return { ok: false, error: 'Apple sign-in failed. Please try again or use your email.' };
    }
    session = data.session;
    appleResult('supabase_exchange', 'success');
  } catch (error) {
    appleResult('supabase_exchange', 'failed', 'supabase_exchange_failed');
    captureError(error instanceof Error ? error : new Error('apple_supabase_exchange_failed'), {
      where: 'appleAuth.signInWithApple',
    });
    return { ok: false, error: 'Apple sign-in failed. Please try again or use your email.' };
  }

  const parts = nameParts(credential.fullName);
  if (parts.length > 0) {
    try {
      await supabase.auth.updateUser({
        data: {
          full_name: parts.join(' '),
          given_name: credential.fullName?.givenName,
          family_name: credential.fullName?.familyName,
        },
      });
    } catch (error) {
      // The authenticated session is valid even if optional display-name
      // enrichment fails. Keep sign-in successful and report the enrichment.
      captureError(error instanceof Error ? error : new Error('apple_profile_update_failed'), {
        where: 'appleAuth.updateUser',
      });
    }
  }

  trackAuthAttempt({ provider: 'apple', flow: 'native', stage: 'session_persisted' });
  try {
    await secureStorage.setItem('ari_token', session.access_token);
    appleResult('session_persisted', 'success');
    addBreadcrumb('auth', 'apple: session adopted');
    return { ok: true };
  } catch (error) {
    appleResult('session_persisted', 'failed', 'session_persist_failed');
    captureError(error instanceof Error ? error : new Error('apple_session_persist_failed'), {
      where: 'appleAuth.persistSession',
    });
    return { ok: false, error: 'Apple sign-in failed. Please try again or use your email.' };
  }
}
