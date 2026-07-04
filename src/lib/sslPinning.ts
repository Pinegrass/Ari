import {
  initializeSslPinning,
  disableSslPinning,
  isSslPinningAvailable,
  addSslPinningErrorListener,
  type PinningOptions,
  type PinningError,
} from 'react-native-ssl-public-key-pinning';
import { captureError, addBreadcrumb } from '../config/sentry';
import { track } from './analytics';

/**
 * Certificate (SPKI public-key) pinning for Ari.
 *
 * Design goals (see docs/ssl-pinning-runbook.md):
 *  - Pin the *issuing intermediate* + long-lived *CA roots*, never the leaf.
 *    Let's Encrypt (Railway) and Google Trust Services (Supabase) rotate their
 *    leaf certs every ~60-90 days; pinning a leaf would brick the app on every
 *    rotation. Roots/intermediates change on a multi-year horizon.
 *  - >=2 backup pins per domain so a single CA rotation can't lock users out.
 *  - A mandatory, OTA-updatable KILL SWITCH: flip SSL_PINNING_ENABLED to false
 *    and publish an OTA update to disable pinning fleet-wide with no native
 *    rebuild. This works even if a bad pin set has bricked all API/auth traffic,
 *    because the Expo update CDN (u.expo.dev) is deliberately NOT pinned — OTA
 *    delivery keeps flowing.
 *  - Fail-OPEN on init errors / missing native module (Expo Go): report to
 *    Sentry and continue unpinned rather than crash or block startup.
 *  - Runtime pin MISMATCH fails that one connection closed (correct — it may be
 *    a real MITM) but is never silent: every mismatch is reported to Sentry and
 *    analytics via the error listener.
 */

// ---------------------------------------------------------------------------
// Kill switch + config (all OTA-updatable — they live in the JS bundle)
// ---------------------------------------------------------------------------

/**
 * OTA-updatable master kill switch. Set to false + `eas update` to disable
 * pinning across the fleet without a native build. See runbook §Kill switch.
 */
export const SSL_PINNING_ENABLED = true;

/**
 * Backstop auto-expiry (yyyy-MM-dd). The library stops enforcing pins after
 * this date even if the user never updates the app, so an unforeseen CA
 * migration can't permanently brick a stale install. Bump on every native
 * release; keep ~12-15 months ahead of the build date.
 */
export const SSL_PINNING_EXPIRATION = '2027-10-01';

/**
 * SPKI SHA-256 pins (base64). Derived 2026-07-04 from the live cert chains —
 * see docs/ssl-pinning-runbook.md for the exact openssl derivation and the
 * cross-check against Google's published root repo. Comments name each cert so
 * rotation is auditable.
 */
export const PIN_SETS = {
  railway: {
    host: 'web-production-7c65f.up.railway.app',
    pins: [
      'brzvtCELCIZUo4sD/qPX0ccRtPsd3DY6RfmxpOU9oB4=', // Let's Encrypt YE1 — current issuing intermediate
      'sCkq5UWXjg+7mKu9lMhhYF5bGLsy7VI/UNW3tccdR7w=', // ISRG Root YE — backup
      'diGVwiVYbubAI3RW4hB9xU8e/CH2GnkuvVFZE8zmgzI=', // ISRG Root X2 — long-lived anchor backup
    ],
  },
  supabase: {
    host: 'cazigdaoqeoqnqwajibf.supabase.co',
    pins: [
      'kIdp6NNEd8wsugYyyIYFsi1ylMCED3hZbSR8ZFsa/A4=', // GTS WE1 — current issuing intermediate
      'mEflZT5enoR1FuXLgYYGqnVEoZvmf9c2bVBpiOjYQ0c=', // GTS Root R4 — backup (matches served root)
      'hxqRlPTu1bMS/0DITB1SSu0vd4u/8l8TjPgfaAp63Gc=', // GTS Root R1 — backup (Google primary RSA root)
    ],
  },
} as const;

// ---------------------------------------------------------------------------
// Pure helpers (unit-tested — no native calls)
// ---------------------------------------------------------------------------

/**
 * Build the library's PinningOptions from PIN_SETS. Pure — safe to unit test.
 * includeSubdomains is false: Ari only ever talks to the two exact hosts, so
 * we scope pinning as tightly as possible.
 */
export function buildPinningOptions(): PinningOptions {
  const options: PinningOptions = {};
  for (const { host, pins } of Object.values(PIN_SETS)) {
    options[host] = {
      includeSubdomains: false,
      publicKeyHashes: [...pins],
      expirationDate: SSL_PINNING_EXPIRATION,
    };
  }
  return options;
}

export type PinningStatus =
  | 'enabled'
  | 'disabled_by_flag'
  | 'unavailable'
  | 'error';

/**
 * Decide what pinning should do given the two inputs that gate it. Pure so the
 * branching (kill switch off, native module missing) is unit-testable without a
 * device. Returns the terminal status for the two short-circuit cases, or
 * 'enabled' when initialization should proceed.
 */
export function resolvePinningDecision(input: {
  enabled: boolean;
  available: boolean;
}): PinningStatus {
  if (!input.enabled) return 'disabled_by_flag';
  if (!input.available) return 'unavailable';
  return 'enabled';
}

// ---------------------------------------------------------------------------
// Runtime wiring
// ---------------------------------------------------------------------------

let _errorSub: { remove: () => void } | null = null;

/** A pin mismatch fired at runtime — report loudly, never swallow. */
function handlePinningError(error: PinningError): void {
  addBreadcrumb('ssl', `pin mismatch: ${error.serverHostname}`, 'error');
  captureError(
    new Error(`SSL pin validation failed for ${error.serverHostname}`),
    { area: 'ssl_pinning', host: error.serverHostname },
  );
  // Best-effort analytics signal so a spike is visible on the dashboard, not
  // only in Sentry. track() is a no-op until the PostHog key is set.
  try {
    track('ssl_pin_validation_failed', { host: error.serverHostname });
  } catch {
    /* analytics must never affect the security path */
  }
}

/**
 * Initialize pinning as early as possible in app startup. Fire-and-forget:
 * resolves to a PinningStatus but never throws — a failure here must not block
 * or crash the app (fail-open). Idempotent-ish: safe to call once at boot.
 */
export async function initSslPinning(): Promise<PinningStatus> {
  const decision = resolvePinningDecision({
    enabled: SSL_PINNING_ENABLED,
    available: safeIsAvailable(),
  });

  if (decision === 'disabled_by_flag') {
    addBreadcrumb('ssl', 'pinning disabled via kill switch');
    return decision;
  }
  if (decision === 'unavailable') {
    // Expo Go or a build without the native module — fail open.
    addBreadcrumb('ssl', 'pinning native module unavailable — continuing unpinned');
    return decision;
  }

  try {
    _errorSub = addSslPinningErrorListener(handlePinningError);
    await initializeSslPinning(buildPinningOptions());
    addBreadcrumb('ssl', 'pinning initialized');
    return 'enabled';
  } catch (err) {
    // Never let pinning init crash startup. Report and continue unpinned.
    _errorSub?.remove();
    _errorSub = null;
    captureError(
      err instanceof Error ? err : new Error('ssl pinning init failed'),
      { area: 'ssl_pinning' },
    );
    return 'error';
  }
}

/**
 * Runtime disable — for a Settings-driven escape hatch or a remote-config path.
 * Tears down the listener and asks the native layer to stop enforcing.
 */
export async function teardownSslPinning(): Promise<void> {
  try {
    _errorSub?.remove();
    _errorSub = null;
    if (safeIsAvailable()) await disableSslPinning();
  } catch {
    /* best effort */
  }
}

function safeIsAvailable(): boolean {
  try {
    return isSslPinningAvailable();
  } catch {
    return false;
  }
}
