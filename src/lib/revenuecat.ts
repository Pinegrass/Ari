import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL, type CustomerInfo } from 'react-native-purchases';
import { reconcileEntitlement } from '../api/billing';

export const ARI_PRO_ENTITLEMENT = 'Ari Finance Pro';

let configured = false;
let identifiedUserId: string | null = null;

function publicApiKey(): string {
  const legacyKey = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY;
  return (Platform.select({
    ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY?.trim() || legacyKey,
    android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY?.trim() || legacyKey,
    default: '',
  }) ?? '').trim();
}

export function isRevenueCatAvailable(): boolean {
  return Platform.OS !== 'web' && publicApiKey().length > 0;
}

export async function syncRevenueCatUser(userId?: string | null): Promise<boolean> {
  if (isMaestroE2E()) return false;
  if (!isRevenueCatAvailable()) return false;

  if (!configured) {
    Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.ERROR);
    Purchases.configure({ apiKey: publicApiKey(), appUserID: userId || undefined });
    configured = true;
    identifiedUserId = userId ?? null;
  } else if (userId && userId !== identifiedUserId) {
    await Purchases.logIn(userId);
    identifiedUserId = userId;
  } else if (!userId && identifiedUserId) {
    await Purchases.logOut();
    identifiedUserId = null;
  }

  return true;
}

export function hasAriPro(info: CustomerInfo): boolean {
  return Boolean(info.entitlements.active[ARI_PRO_ENTITLEMENT]);
}

/**
 * Login-time entitlement refresh. Webhooks keep the server-side tier in sync,
 * but an event can be missed or a purchase restored on a new device before
 * the webhook lands. When the SDK says Pro but the server-side tier disagrees,
 * ask the backend to verify with RevenueCat directly and repair the tier.
 *
 * Returns the effective Pro status. Never throws — billing repair must not
 * break the login path.
 */
export async function refreshEntitlements(
  userId: string,
  serverTier: string | undefined,
): Promise<boolean> {
  if (isMaestroE2E()) return true;
  if (!(await syncRevenueCatUser(userId))) return serverTier === 'pro';
  try {
    const sdkPro = hasAriPro(await Purchases.getCustomerInfo());
    if (!sdkPro || serverTier === 'pro') return sdkPro;
    const result = await reconcileEntitlement();
    return result.pro;
  } catch {
    // 503 (server key not configured), network, SDK error — keep the
    // server-side tier as the source of truth rather than blocking login.
    return serverTier === 'pro';
  }
}

function isMaestroE2E(): boolean {
  return process.env.EXPO_PUBLIC_MAESTRO_E2E === '1';
}

/** Check the current RevenueCat entitlement status. Returns false if the SDK is not configured.
 *  The Maestro E2E build is treated as Pro so paywall-gated flows can be exercised without a
 *  real store purchase. */
export async function isAriPro(): Promise<boolean> {
  if (isMaestroE2E()) return true;
  if (!isRevenueCatAvailable()) return false;
  try {
    return hasAriPro(await Purchases.getCustomerInfo());
  } catch {
    return false;
  }
}
