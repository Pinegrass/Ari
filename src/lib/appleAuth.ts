import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { isSupabaseConfigured, supabase } from './supabase';
import { secureStorage } from './secureStorage';
import { addBreadcrumb, captureError, Sentry } from '../config/sentry';

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

export async function isAppleSignInAvailable(): Promise<boolean> {
  if (Platform.OS !== 'ios') return false;
  try {
    return await AppleAuthentication.isAvailableAsync();
  } catch {
    return false;
  }
}

export async function signInWithApple(): Promise<AppleAuthResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: 'Apple sign-in is not configured for this build.' };
  }
  if (!(await isAppleSignInAvailable())) {
    return { ok: false, error: 'Apple sign-in is not available on this device.' };
  }

  try {
    addBreadcrumb('auth', 'apple: native sign-in starting');
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
    if (!credential.identityToken) {
      throw new Error('Apple did not return an identity token.');
    }

    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
    });
    if (error || !data.session) {
      Sentry.captureMessage('supabase_apple_exchange_failed', {
        level: 'error',
        extra: { message: error?.message },
      });
      return { ok: false, error: 'Apple sign-in failed. Please try again or use your email.' };
    }

    const parts = nameParts(credential.fullName);
    if (parts.length > 0) {
      await supabase.auth.updateUser({
        data: {
          full_name: parts.join(' '),
          given_name: credential.fullName?.givenName,
          family_name: credential.fullName?.familyName,
        },
      });
    }

    await secureStorage.setItem('ari_token', data.session.access_token);
    addBreadcrumb('auth', 'apple: session adopted');
    return { ok: true };
  } catch (error) {
    if (appleErrorCode(error) === 'ERR_REQUEST_CANCELED') {
      return { ok: false, cancelled: true };
    }
    captureError(error instanceof Error ? error : new Error('apple_sign_in_unknown'), {
      where: 'appleAuth.signInWithApple',
    });
    return { ok: false, error: 'Apple sign-in failed. Please try again or use your email.' };
  }
}
