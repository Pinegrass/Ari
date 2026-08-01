import Purchases from 'react-native-purchases';
import {
  ARI_PRO_ENTITLEMENT,
  hasAriPro,
  isAriPro,
  isRevenueCatAvailable,
  refreshEntitlements,
  syncRevenueCatUser,
} from '../revenuecat';
import { reconcileEntitlement } from '../../api/billing';

const mockedPurchases = Purchases as jest.Mocked<typeof Purchases>;
let mockPlatformOS: string;

jest.mock('react-native', () => ({
  Platform: {
    get OS() {
      return mockPlatformOS;
    },
    select: jest.fn((obj: Record<string, unknown>) => obj[mockPlatformOS]),
  },
}));

jest.mock('react-native-purchases', () => ({
  __esModule: true,
  default: {
    setLogLevel: jest.fn(),
    configure: jest.fn(),
    logIn: jest.fn().mockResolvedValue(undefined),
    logOut: jest.fn().mockResolvedValue(undefined),
    getCustomerInfo: jest.fn(),
  },
  LOG_LEVEL: { DEBUG: 'DEBUG', ERROR: 'ERROR' },
}));

jest.mock('../../api/billing', () => ({
  reconcileEntitlement: jest.fn(),
}));

const mockedReconcile = reconcileEntitlement as jest.Mock;

describe('isRevenueCatAvailable', () => {
  beforeEach(() => {
    mockPlatformOS = 'ios';
    delete process.env.EXPO_PUBLIC_REVENUECAT_API_KEY;
    delete process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY;
    delete process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY;
  });

  it('is unavailable on web', () => {
    mockPlatformOS = 'web';
    process.env.EXPO_PUBLIC_REVENUECAT_API_KEY = 'test_key';
    expect(isRevenueCatAvailable()).toBe(false);
  });

  it('is unavailable when no API key is configured', () => {
    expect(isRevenueCatAvailable()).toBe(false);
  });

  it('uses the platform-specific key when present', () => {
    process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY = 'ios_key';
    expect(isRevenueCatAvailable()).toBe(true);
  });

  it('falls back to the legacy key when platform key is absent', () => {
    process.env.EXPO_PUBLIC_REVENUECAT_API_KEY = 'legacy_key';
    expect(isRevenueCatAvailable()).toBe(true);
  });
});

describe('hasAriPro', () => {
  it('returns true when the Ari Finance Pro entitlement is active', () => {
    const info = {
      entitlements: { active: { [ARI_PRO_ENTITLEMENT]: {} as never } },
    };
    expect(hasAriPro(info as never)).toBe(true);
  });

  it('returns false when the entitlement is missing', () => {
    const info = { entitlements: { active: {} } };
    expect(hasAriPro(info as never)).toBe(false);
  });
});

describe('isAriPro', () => {
  beforeEach(() => {
    mockPlatformOS = 'ios';
    delete process.env.EXPO_PUBLIC_MAESTRO_E2E;
    delete process.env.EXPO_PUBLIC_REVENUECAT_API_KEY;
    delete process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY;
    jest.clearAllMocks();
  });

  it('short-circuits to true in Maestro E2E builds', async () => {
    process.env.EXPO_PUBLIC_MAESTRO_E2E = '1';
    await expect(isAriPro()).resolves.toBe(true);
    expect(mockedPurchases.getCustomerInfo).not.toHaveBeenCalled();
  });

  it('returns false when RevenueCat is not configured', async () => {
    await expect(isAriPro()).resolves.toBe(false);
  });

  it('returns true when the customer has the Pro entitlement', async () => {
    process.env.EXPO_PUBLIC_REVENUECAT_API_KEY = 'key';
    mockedPurchases.getCustomerInfo.mockResolvedValueOnce({
      entitlements: { active: { [ARI_PRO_ENTITLEMENT]: {} as never } },
    } as never);
    await expect(isAriPro()).resolves.toBe(true);
  });

  it('returns false when the customer does not have the Pro entitlement', async () => {
    process.env.EXPO_PUBLIC_REVENUECAT_API_KEY = 'key';
    mockedPurchases.getCustomerInfo.mockResolvedValueOnce({
      entitlements: { active: {} },
    } as never);
    await expect(isAriPro()).resolves.toBe(false);
  });

  it('returns false when getCustomerInfo rejects', async () => {
    process.env.EXPO_PUBLIC_REVENUECAT_API_KEY = 'key';
    mockedPurchases.getCustomerInfo.mockRejectedValueOnce(new Error('network'));
    await expect(isAriPro()).resolves.toBe(false);
  });
});

describe('syncRevenueCatUser', () => {
  beforeEach(() => {
    mockPlatformOS = 'ios';
    delete process.env.EXPO_PUBLIC_REVENUECAT_API_KEY;
    delete process.env.EXPO_PUBLIC_MAESTRO_E2E;
    jest.clearAllMocks();
  });

  it('returns false in Maestro E2E builds without touching the SDK', async () => {
    process.env.EXPO_PUBLIC_MAESTRO_E2E = '1';
    process.env.EXPO_PUBLIC_REVENUECAT_API_KEY = 'key';
    await expect(syncRevenueCatUser('user-1')).resolves.toBe(false);
    expect(mockedPurchases.configure).not.toHaveBeenCalled();
  });

  it('returns false when RevenueCat is not configured', async () => {
    await expect(syncRevenueCatUser('user-1')).resolves.toBe(false);
  });

  it('configures the SDK on first call and returns true', async () => {
    process.env.EXPO_PUBLIC_REVENUECAT_API_KEY = 'key';
    await expect(syncRevenueCatUser('user-1')).resolves.toBe(true);
    expect(mockedPurchases.configure).toHaveBeenCalledWith(
      expect.objectContaining({ apiKey: 'key', appUserID: 'user-1' }),
    );
  });

  it('logs in when the user id changes', async () => {
    process.env.EXPO_PUBLIC_REVENUECAT_API_KEY = 'key';
    await syncRevenueCatUser('user-1');
    await expect(syncRevenueCatUser('user-2')).resolves.toBe(true);
    expect(mockedPurchases.logIn).toHaveBeenCalledWith('user-2');
  });

  it('logs out when the user id is cleared', async () => {
    process.env.EXPO_PUBLIC_REVENUECAT_API_KEY = 'key';
    await syncRevenueCatUser('user-1');
    await expect(syncRevenueCatUser(null)).resolves.toBe(true);
    expect(mockedPurchases.logOut).toHaveBeenCalled();
  });
});

describe('refreshEntitlements', () => {
  beforeEach(() => {
    mockPlatformOS = 'ios';
    process.env.EXPO_PUBLIC_REVENUECAT_API_KEY = 'key';
    delete process.env.EXPO_PUBLIC_MAESTRO_E2E;
    jest.clearAllMocks();
  });

  it('short-circuits to true in Maestro E2E builds', async () => {
    process.env.EXPO_PUBLIC_MAESTRO_E2E = '1';
    await expect(refreshEntitlements('user-1', 'free')).resolves.toBe(true);
    expect(mockedPurchases.getCustomerInfo).not.toHaveBeenCalled();
  });

  it('falls back to the server tier when RevenueCat is not configured', async () => {
    delete process.env.EXPO_PUBLIC_REVENUECAT_API_KEY;
    await expect(refreshEntitlements('user-1', 'pro')).resolves.toBe(true);
    await expect(refreshEntitlements('user-1', 'free')).resolves.toBe(false);
  });

  it('returns the SDK status when it agrees with the server', async () => {
    mockedPurchases.getCustomerInfo.mockResolvedValueOnce({
      entitlements: { active: { [ARI_PRO_ENTITLEMENT]: {} as never } },
    } as never);
    await expect(refreshEntitlements('user-1', 'pro')).resolves.toBe(true);
    expect(mockedReconcile).not.toHaveBeenCalled();
  });

  it('reconciles with the backend when SDK says Pro but server says free', async () => {
    mockedPurchases.getCustomerInfo.mockResolvedValueOnce({
      entitlements: { active: { [ARI_PRO_ENTITLEMENT]: {} as never } },
    } as never);
    mockedReconcile.mockResolvedValueOnce({ tier: 'pro', pro: true });
    await expect(refreshEntitlements('user-1', 'free')).resolves.toBe(true);
    expect(mockedReconcile).toHaveBeenCalled();
  });

  it('does not reconcile when the SDK has no active entitlement', async () => {
    mockedPurchases.getCustomerInfo.mockResolvedValueOnce({
      entitlements: { active: {} },
    } as never);
    await expect(refreshEntitlements('user-1', 'free')).resolves.toBe(false);
    expect(mockedReconcile).not.toHaveBeenCalled();
  });

  it('keeps the server tier when reconcile fails (503 / offline)', async () => {
    mockedPurchases.getCustomerInfo.mockResolvedValueOnce({
      entitlements: { active: { [ARI_PRO_ENTITLEMENT]: {} as never } },
    } as never);
    mockedReconcile.mockRejectedValueOnce(new Error('503'));
    await expect(refreshEntitlements('user-1', 'free')).resolves.toBe(false);
  });
});
