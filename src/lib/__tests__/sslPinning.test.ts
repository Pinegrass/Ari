import * as pinningLib from 'react-native-ssl-public-key-pinning';
import {
  buildPinningOptions,
  resolvePinningDecision,
  initSslPinning,
  teardownSslPinning,
  PIN_SETS,
  SSL_PINNING_EXPIRATION,
} from '../sslPinning';
import { captureError } from '../../config/sentry';

jest.mock('../../config/sentry', () => ({
  captureError: jest.fn(),
  addBreadcrumb: jest.fn(),
}));
jest.mock('../analytics', () => ({ track: jest.fn() }));

const lib = pinningLib as jest.Mocked<typeof pinningLib>;

beforeEach(() => {
  jest.clearAllMocks();
  lib.isSslPinningAvailable.mockReturnValue(true);
  lib.initializeSslPinning.mockResolvedValue(undefined);
  lib.addSslPinningErrorListener.mockReturnValue({ remove: jest.fn() } as never);
});

describe('buildPinningOptions', () => {
  const opts = buildPinningOptions();

  it('pins both the Railway API host and the Supabase host', () => {
    expect(Object.keys(opts).sort()).toEqual(
      [PIN_SETS.railway.host, PIN_SETS.supabase.host].sort(),
    );
  });

  it('carries >=2 backup pins per domain (>=3 total each: 1 issuer + 2 backups)', () => {
    for (const host of Object.keys(opts)) {
      expect(opts[host].publicKeyHashes.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('emits well-formed base64 SHA-256 SPKI pins (44 chars, = terminated)', () => {
    const all = Object.values(opts).flatMap((o) => o.publicKeyHashes);
    for (const pin of all) {
      expect(pin).toMatch(/^[A-Za-z0-9+/]{43}=$/);
    }
  });

  it('sets a backstop expiration date so stale installs can never brick', () => {
    for (const host of Object.keys(opts)) {
      expect(opts[host].expirationDate).toBe(SSL_PINNING_EXPIRATION);
    }
    expect(SSL_PINNING_EXPIRATION).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('does not pin subdomains (scoped tightly to the two exact hosts)', () => {
    for (const host of Object.keys(opts)) {
      expect(opts[host].includeSubdomains).toBe(false);
    }
  });
});

describe('resolvePinningDecision (kill switch + availability branching)', () => {
  it('short-circuits to disabled_by_flag when the OTA kill switch is off', () => {
    expect(resolvePinningDecision({ enabled: false, available: true })).toBe(
      'disabled_by_flag',
    );
  });

  it('fails open to unavailable when the native module is missing (Expo Go)', () => {
    expect(resolvePinningDecision({ enabled: true, available: false })).toBe(
      'unavailable',
    );
  });

  it('proceeds to enabled only when both flag and module are present', () => {
    expect(resolvePinningDecision({ enabled: true, available: true })).toBe(
      'enabled',
    );
  });
});

describe('initSslPinning', () => {
  it('installs the error listener and initializes with the pin set', async () => {
    const status = await initSslPinning();
    expect(status).toBe('enabled');
    expect(lib.addSslPinningErrorListener).toHaveBeenCalledTimes(1);
    expect(lib.initializeSslPinning).toHaveBeenCalledWith(buildPinningOptions());
  });

  it('fails OPEN (never throws) and reports to Sentry when init rejects', async () => {
    lib.initializeSslPinning.mockRejectedValueOnce(new Error('native boom'));
    const status = await initSslPinning();
    expect(status).toBe('error');
    expect(captureError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ area: 'ssl_pinning' }),
    );
  });

  it('does not touch the native layer when the kill switch is off', async () => {
    // Availability is irrelevant once the flag gates it off. We assert the
    // decision helper drives this; init should report the flag status.
    // (SSL_PINNING_ENABLED is a const true in the bundle, so we validate the
    // pure resolver already covers the off case above; here we assert the
    // available=false fail-open path leaves the native module untouched.)
    lib.isSslPinningAvailable.mockReturnValue(false);
    const status = await initSslPinning();
    expect(status).toBe('unavailable');
    expect(lib.initializeSslPinning).not.toHaveBeenCalled();
  });
});

describe('deliberate failure-mode: a runtime pin mismatch', () => {
  it('reports the mismatched host to Sentry (loud, never silent fail-closed)', async () => {
    let fired: ((e: { serverHostname: string }) => void) | undefined;
    lib.addSslPinningErrorListener.mockImplementation((cb) => {
      fired = cb as typeof fired;
      return { remove: jest.fn() } as never;
    });

    await initSslPinning();
    expect(fired).toBeDefined();

    // Simulate the native layer detecting a bad cert for the API host — this is
    // exactly what a MITM / wrong-pin build would trigger. The connection is
    // failed closed natively; our job is to make sure it is REPORTED.
    fired!({ serverHostname: PIN_SETS.railway.host });

    expect(captureError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining(PIN_SETS.railway.host),
      }),
      expect.objectContaining({ area: 'ssl_pinning', host: PIN_SETS.railway.host }),
    );
  });
});

describe('teardownSslPinning', () => {
  it('disables the native layer when available', async () => {
    await initSslPinning();
    await teardownSslPinning();
    expect(lib.disableSslPinning).toHaveBeenCalled();
  });
});
