/**
 * Sync engine flush logic (Sprint 2, Commit 4). Drives flushPending over the
 * real localStore (stateful AsyncStorage mock) with a mocked transactions API,
 * covering: a pending create syncs and leaves the queue empty; a tombstone
 * delete is sent and removed; a network failure marks the row failed and keeps
 * it pending. Backlog creates must go up with suppressAlerts (G7).
 */
import { AppState } from 'react-native';
import { localStore } from '../localStore';
import { flushPending, startAutoFlush } from '../syncEngine';
import * as txnApi from '../../api/transactions';
import { ApiError } from '../../api/client';
import { track } from '../analytics';
import { captureError, addBreadcrumb } from '../../config/sentry';

jest.mock('../analytics', () => ({ track: jest.fn() }));
jest.mock('../../config/sentry', () => ({
  addBreadcrumb: jest.fn(),
  captureError: jest.fn(),
}));

/** Let queued microtasks + a 0ms macrotask drain (async run() has await chains). */
const drain = async () => {
  for (let i = 0; i < 5; i++) await new Promise<void>((r) => setTimeout(r, 0));
};

jest.mock('@react-native-async-storage/async-storage', () => {
  let store: Record<string, string> = {};
  return {
    __esModule: true,
    default: {
      getItem: jest.fn(async (k: string) => (k in store ? store[k] : null)),
      setItem: jest.fn(async (k: string, v: string) => {
        store[k] = v;
      }),
      removeItem: jest.fn(async (k: string) => {
        delete store[k];
      }),
      multiRemove: jest.fn(async (keys: string[]) => {
        keys.forEach((k) => delete store[k]);
      }),
    },
  };
});

jest.mock('expo-crypto', () => {
  let n = 0;
  return { randomUUID: jest.fn(() => `uuid-${++n}`) };
});

jest.mock('../../api/transactions', () => ({
  addTransaction: jest.fn(),
  deleteTransaction: jest.fn(),
  updateTransaction: jest.fn(),
  getTransactions: jest.fn(),
}));

const input = {
  type: 'expense' as const,
  amount: 100,
  category: 'food',
  description: 'test',
  note: '',
  date: '2026-06-18',
};

beforeEach(async () => {
  await localStore.clear();
  jest.clearAllMocks();
});

describe('syncEngine.flushPending', () => {
  it('syncs a pending create (with suppressAlerts) and empties the queue', async () => {
    const rec = await localStore.create(input);
    (txnApi.addTransaction as jest.Mock).mockResolvedValue({
      id: rec.id,
      userId: 'u1',
      updatedAt: '2026-06-18T10:00:00Z',
    });

    const { changed } = await flushPending();

    expect(changed).toBe(true);
    expect(txnApi.addTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ id: rec.id, suppressAlerts: true })
    );
    expect(await localStore.getPending()).toHaveLength(0);
  });

  it('sends a tombstone delete and removes the row', async () => {
    const rec = await localStore.create(input);
    await localStore.markSynced(rec.id);
    await localStore.softDelete(rec.id);
    (txnApi.deleteTransaction as jest.Mock).mockResolvedValue({ message: 'ok' });

    await flushPending();

    expect(txnApi.deleteTransaction).toHaveBeenCalledWith(rec.id);
    expect(await localStore.getPending()).toHaveLength(0);
  });

  it('marks a row failed and keeps it pending on a network error', async () => {
    await localStore.create(input);
    (txnApi.addTransaction as jest.Mock).mockRejectedValue(new Error('network down'));

    const { changed } = await flushPending();

    expect(changed).toBe(true);
    const pending = await localStore.getPending();
    expect(pending).toHaveLength(1);
    expect(pending[0].syncStatus).toBe('failed');
    expect(pending[0].retryCount).toBe(1);
  });

  it('is a no-op when there is nothing pending', async () => {
    const { changed } = await flushPending();
    expect(changed).toBe(false);
    expect(txnApi.addTransaction).not.toHaveBeenCalled();
  });

  it('flushes a pending update via PUT and marks it synced', async () => {
    const rec = await localStore.create(input);
    await localStore.markSynced(rec.id, { updatedAt: '2026-06-18T10:00:00Z', userId: 'u1' });
    await localStore.update(rec.id, { amount: 200 });

    (txnApi.updateTransaction as jest.Mock).mockResolvedValue({
      id: rec.id,
      userId: 'u1',
      updatedAt: '2026-06-18T11:00:00Z',
    });

    const { changed } = await flushPending();

    expect(changed).toBe(true);
    expect(txnApi.updateTransaction).toHaveBeenCalledWith(
      rec.id,
      expect.objectContaining({ amount: 200 })
    );
    expect(await localStore.getPending()).toHaveLength(0);
  });

  it('server-wins on 409 conflict: overwrites local and marks synced', async () => {
    const rec = await localStore.create(input);
    await localStore.markSynced(rec.id, { updatedAt: '2026-06-18T09:00:00Z', userId: 'u1' });
    await localStore.update(rec.id, { amount: 999 });

    const conflict = new ApiError(409, 'Conflict');
    (conflict as ApiError & { body: unknown }).body = {
      conflict: true,
      current: { id: rec.id, amount: 777, category: 'food', description: 'test', note: '', date: '2026-06-18', type: 'expense', userId: 'u1', updatedAt: '2026-06-18T12:00:00Z', month: '2026-06', createdAt: '2026-06-18T09:00:00Z' },
    };
    (txnApi.updateTransaction as jest.Mock).mockRejectedValue(conflict);

    const { changed } = await flushPending();

    expect(changed).toBe(true);
    expect(await localStore.getPending()).toHaveLength(0);
    const all = await localStore.getAll();
    const row = all.find((t) => t.id === rec.id);
    expect(row?.amount).toBe(777);
    expect(row?.syncStatus).toBe('synced');
  });

  it('server-wins on 409 with no body: marks synced, empties the queue', async () => {
    const rec = await localStore.create(input);
    await localStore.markSynced(rec.id, { updatedAt: '2026-06-18T09:00:00Z', userId: 'u1' });
    await localStore.update(rec.id, { amount: 5 });
    const conflict = new ApiError(409, 'Conflict'); // no .body.current
    (txnApi.updateTransaction as jest.Mock).mockRejectedValue(conflict);

    const { changed } = await flushPending();

    expect(changed).toBe(true);
    expect(await localStore.getPending()).toHaveLength(0);
  });

  it('on a 4xx it skips the bad row but keeps draining the rest', async () => {
    await localStore.create(input); // row A (oldest)
    await localStore.create({ ...input, amount: 200 }); // row B
    (txnApi.addTransaction as jest.Mock)
      .mockRejectedValueOnce(new ApiError(400, 'bad amount')) // A fails 4xx
      .mockResolvedValueOnce({ userId: 'u1', updatedAt: 'x' }); // B succeeds

    await flushPending();

    // Both were attempted (4xx did not break the pass); B synced, A left failed.
    expect(txnApi.addTransaction).toHaveBeenCalledTimes(2);
    const pending = await localStore.getPending();
    expect(pending).toHaveLength(1);
    expect(pending[0].syncStatus).toBe('failed');
  });

  it('on a 5xx it stops the pass, leaving later rows untouched', async () => {
    await localStore.create(input); // A
    await localStore.create({ ...input, amount: 200 }); // B
    (txnApi.addTransaction as jest.Mock).mockRejectedValue(new ApiError(503, 'down'));

    await flushPending();

    // A failed and broke the pass — B was never attempted.
    expect(txnApi.addTransaction).toHaveBeenCalledTimes(1);
    expect(await localStore.getPending()).toHaveLength(2);
  });

  it('skips a row that has already exhausted its retries (GIVE_UP_AFTER)', async () => {
    const rec = await localStore.create(input);
    for (let i = 0; i < 6; i++) await localStore.markFailed(rec.id, 'boom'); // retryCount = 6

    const { changed } = await flushPending();

    expect(changed).toBe(false);
    expect(txnApi.addTransaction).not.toHaveBeenCalled();
  });

  it('single-flight: a concurrent second flush is a no-op', async () => {
    await localStore.create(input);
    (txnApi.addTransaction as jest.Mock).mockResolvedValue({ userId: 'u1', updatedAt: 'x' });

    const p1 = flushPending();
    const p2 = flushPending(); // flushing already true
    const [r1, r2] = await Promise.all([p1, p2]);

    expect(r2.changed).toBe(false); // second pass short-circuited
    expect(r1.changed).toBe(true);
    expect(txnApi.addTransaction).toHaveBeenCalledTimes(1);
  });

  describe('telemetry (B6)', () => {
    it('emits sync_failed + a breadcrumb on a failure', async () => {
      await localStore.create(input);
      (txnApi.addTransaction as jest.Mock).mockRejectedValue(new ApiError(500, 'down'));

      await flushPending();

      expect(track).toHaveBeenCalledWith('sync_failed', { op: 'create', status: 500 });
      expect(addBreadcrumb).toHaveBeenCalled();
      expect(captureError).not.toHaveBeenCalled(); // not stuck yet
    });

    it('escalates a stuck row to Sentry once retries are exhausted', async () => {
      const rec = await localStore.create(input);
      for (let i = 0; i < 5; i++) await localStore.markFailed(rec.id, 'x'); // retryCount = 5
      (txnApi.addTransaction as jest.Mock).mockRejectedValue(new Error('network'));

      await flushPending(); // 5 + 1 >= GIVE_UP_AFTER(6) → stuck

      expect(captureError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({ area: 'sync', op: 'create' }),
      );
      expect(track).toHaveBeenCalledWith('sync_stuck', { op: 'create', status: 0 });
    });
  });
});

describe('syncEngine.startAutoFlush', () => {
  // Own the AppState subscription so tests never depend on jest-expo's default
  // return value (which can be undefined) and never leak across cases.
  let appStateSpy: jest.SpyInstance;
  let removeMock: jest.Mock;
  let stateHandler: (s: string) => void = () => {};

  beforeEach(() => {
    removeMock = jest.fn();
    appStateSpy = jest.spyOn(AppState, 'addEventListener').mockImplementation(((
      _e: string,
      cb: (s: string) => void,
    ) => {
      stateHandler = cb;
      return { remove: removeMock };
    }) as never);
  });
  afterEach(() => appStateSpy.mockRestore());

  it('drains once on start and notifies on change', async () => {
    await localStore.create(input);
    (txnApi.addTransaction as jest.Mock).mockResolvedValue({ userId: 'u1', updatedAt: 'x' });
    const onChange = jest.fn();

    const stop = startAutoFlush(onChange);
    await drain();

    expect(txnApi.addTransaction).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalled();
    expect(await localStore.getPending()).toHaveLength(0);
    stop();
  });

  it('re-flushes when the app returns to the foreground', async () => {
    (txnApi.addTransaction as jest.Mock).mockResolvedValue({ userId: 'u1', updatedAt: 'x' });
    const stop = startAutoFlush(jest.fn());
    await drain();

    await localStore.create(input); // new offline work arrives
    stateHandler('active'); // foreground event
    await drain();

    expect(txnApi.addTransaction).toHaveBeenCalledTimes(1);
    stop();
  });

  it('reports queue depth when work remains after a failed flush', async () => {
    await localStore.create(input);
    (txnApi.addTransaction as jest.Mock).mockRejectedValue(new ApiError(500, 'down'));

    const stop = startAutoFlush(jest.fn());
    await drain();

    expect(track).toHaveBeenCalledWith('sync_queue_depth', { depth: 1 });
    stop(); // clears the scheduled backoff retry
  });

  it('cleanup removes the AppState subscription', async () => {
    const stop = startAutoFlush(jest.fn());
    await drain();

    stop();

    expect(removeMock).toHaveBeenCalled();
  });
});
