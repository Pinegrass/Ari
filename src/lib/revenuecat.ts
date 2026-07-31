import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL, type CustomerInfo } from 'react-native-purchases';

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

/** Check the current RevenueCat entitlement status. Returns false if the SDK is not configured. */
export async function isAriPro(): Promise<boolean> {
  if (!isRevenueCatAvailable()) return false;
  try {
    return hasAriPro(await Purchases.getCustomerInfo());
  } catch {
    return false;
  }
}
