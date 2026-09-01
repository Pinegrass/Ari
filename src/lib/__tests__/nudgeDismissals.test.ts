import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  dismissNudgeForUser,
  isNudgeRecentlyDismissed,
  nudgeDismissalStorageKey,
  NUDGE_DISMISSAL_MS,
} from '../nudgeDismissals';

describe('account-scoped nudge dismissals', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('stores multiple dismissals under the current account only', async () => {
    (AsyncStorage.getItem as jest.Mock)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(JSON.stringify({ first: 1_000 }));

    await dismissNudgeForUser('user-a', 'first', 1_000);
    await dismissNudgeForUser('user-a', 'second', 2_000);

    expect(AsyncStorage.setItem).toHaveBeenLastCalledWith(
      nudgeDismissalStorageKey('user-a'),
      JSON.stringify({ second: 2_000, first: 1_000 }),
    );
    expect(nudgeDismissalStorageKey('user-a')).not.toBe(nudgeDismissalStorageKey('user-b'));
  });

  it('recognizes an active dismissal and expires it after 24 hours', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
      JSON.stringify({ current: 10_000 }),
    );

    await expect(isNudgeRecentlyDismissed('user-a', 'current', 10_001)).resolves.toBe(true);
    await expect(
      isNudgeRecentlyDismissed('user-a', 'current', 10_000 + NUDGE_DISMISSAL_MS),
    ).resolves.toBe(false);
  });

  it('ignores malformed stored state', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('{not-json');

    await expect(isNudgeRecentlyDismissed('user-a', 'current')).resolves.toBe(false);
  });
});
