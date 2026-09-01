import { Platform } from 'react-native';
import { track } from './analytics';

export type AuthProvider = 'email' | 'google' | 'apple';
export type AuthFlow = 'password' | 'native' | 'browser';

export type AuthStage =
  | 'button_tapped'
  | 'configuration'
  | 'play_services'
  | 'provider_picker'
  | 'provider_callback'
  | 'credential_exchange'
  | 'supabase_exchange'
  | 'session_persisted'
  | 'profile_fetch';

export type AuthOutcome = 'started' | 'success' | 'failed' | 'cancelled';

const KNOWN_ERROR_CODES = new Set([
  'not_configured',
  'play_services_unavailable',
  'sign_in_required',
  'developer_error',
  'provider_error',
  'provider_cancelled',
  'callback_mismatch',
  'callback_provider_error',
  'callback_incomplete_session',
  'supabase_exchange_failed',
  'session_persist_failed',
  'profile_fetch_failed',
  'invalid_credentials',
  'rate_limited',
  'server_error',
  'network_error',
  'unknown_error',
] as const);

export type AuthErrorCode = typeof KNOWN_ERROR_CODES extends Set<infer T> ? T : never;

/**
 * Convert native/provider failures into a small analytics-safe vocabulary.
 * Raw messages, URLs, email addresses and tokens must never reach PostHog.
 */
export function sanitizeAuthErrorCode(code: string | null | undefined): string {
  if (!code) return 'unknown_error';
  const normalized = code.trim().toLowerCase();
  if (KNOWN_ERROR_CODES.has(normalized as AuthErrorCode)) return normalized;
  if (normalized === '10' || normalized.includes('developer_error')) return 'developer_error';
  if (normalized.includes('network')) return 'network_error';
  return 'provider_error';
}

export function authApiErrorCode(status: number | null | undefined): string {
  if (status === 400 || status === 401 || status === 404) return 'invalid_credentials';
  if (status === 429) return 'rate_limited';
  if (status && status >= 500) return 'server_error';
  if (status === 0) return 'network_error';
  return 'unknown_error';
}

type AuthEvent = {
  provider: AuthProvider;
  flow: AuthFlow;
  stage: AuthStage;
};

export function trackAuthAttempt(event: AuthEvent): void {
  track('auth_attempt', {
    ...event,
    platform: Platform.OS,
    outcome: 'started',
  });
}

export function trackAuthResult(
  event: AuthEvent & { outcome: Exclude<AuthOutcome, 'started'>; errorCode?: string },
): void {
  track('auth_result', {
    provider: event.provider,
    flow: event.flow,
    stage: event.stage,
    platform: Platform.OS,
    outcome: event.outcome,
    ...(event.errorCode
      ? { error_code: sanitizeAuthErrorCode(event.errorCode) }
      : {}),
  });
}
