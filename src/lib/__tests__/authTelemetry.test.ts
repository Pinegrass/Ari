import { authApiErrorCode, sanitizeAuthErrorCode } from '../authTelemetry';

jest.mock('../analytics', () => ({ track: jest.fn() }));

describe('auth telemetry sanitization', () => {
  it('keeps only allowlisted error codes', () => {
    expect(sanitizeAuthErrorCode('callback_mismatch')).toBe('callback_mismatch');
    expect(sanitizeAuthErrorCode('10')).toBe('developer_error');
    expect(sanitizeAuthErrorCode('Network request failed')).toBe('network_error');
  });

  it('does not forward raw provider messages or URLs', () => {
    expect(sanitizeAuthErrorCode('access_token=secret@example.com')).toBe('provider_error');
    expect(sanitizeAuthErrorCode('https://example.com/callback?code=secret')).toBe('provider_error');
  });

  it('maps API statuses without preserving response bodies', () => {
    expect(authApiErrorCode(401)).toBe('invalid_credentials');
    expect(authApiErrorCode(429)).toBe('rate_limited');
    expect(authApiErrorCode(503)).toBe('server_error');
    expect(authApiErrorCode(0)).toBe('network_error');
  });
});
