import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { signInWithApple } from '../appleAuth';
import { secureStorage } from '../secureStorage';
import { supabase } from '../supabase';
import { trackAuthAttempt, trackAuthResult } from '../authTelemetry';

jest.mock('expo-apple-authentication', () => ({
  isAvailableAsync: jest.fn(),
  signInAsync: jest.fn(),
  AppleAuthenticationScope: { FULL_NAME: 0, EMAIL: 1 },
}));
jest.mock('../supabase', () => ({
  isSupabaseConfigured: jest.fn(() => true),
  supabase: {
    auth: {
      signInWithIdToken: jest.fn(),
      updateUser: jest.fn(),
    },
  },
}));
jest.mock('../secureStorage', () => ({
  secureStorage: { setItem: jest.fn() },
}));
jest.mock('../../config/sentry', () => ({
  addBreadcrumb: jest.fn(),
  captureError: jest.fn(),
  Sentry: { captureMessage: jest.fn() },
}));
jest.mock('../authTelemetry', () => ({
  trackAuthAttempt: jest.fn(),
  trackAuthResult: jest.fn(),
}));

describe('Apple authentication telemetry', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (Platform as { OS: string }).OS = 'ios';
    (AppleAuthentication.isAvailableAsync as jest.Mock).mockResolvedValue(true);
    (AppleAuthentication.signInAsync as jest.Mock).mockResolvedValue({
      identityToken: 'identity-token',
      fullName: null,
    });
    (supabase.auth.signInWithIdToken as jest.Mock).mockResolvedValue({
      data: { session: { access_token: 'access-token' } },
      error: null,
    });
    (secureStorage.setItem as jest.Mock).mockResolvedValue(undefined);
  });

  it('records every successful provider stage', async () => {
    await expect(signInWithApple()).resolves.toEqual({ ok: true });

    expect(trackAuthAttempt).toHaveBeenCalledWith(expect.objectContaining({
      provider: 'apple',
      stage: 'configuration',
    }));
    expect(trackAuthResult).toHaveBeenCalledWith(expect.objectContaining({
      provider: 'apple',
      stage: 'supabase_exchange',
      outcome: 'success',
    }));
    expect(trackAuthResult).toHaveBeenCalledWith(expect.objectContaining({
      provider: 'apple',
      stage: 'session_persisted',
      outcome: 'success',
    }));
  });

  it('records provider cancellation instead of dropping the result event', async () => {
    (AppleAuthentication.signInAsync as jest.Mock).mockRejectedValue({
      code: 'ERR_REQUEST_CANCELED',
    });

    await expect(signInWithApple()).resolves.toEqual({ ok: false, cancelled: true });
    expect(trackAuthResult).toHaveBeenCalledWith(expect.objectContaining({
      provider: 'apple',
      stage: 'provider_picker',
      outcome: 'cancelled',
      errorCode: 'provider_cancelled',
    }));
  });
});
