/**
 * Regression test for the Sprint-0 B1 fix: addTransaction must never let a
 * genuine failure masquerade as a successful save.
 *
 *   - A permanent server rejection (4xx, non-401) → { ok: false } AND the row
 *     is left marked `failed` (visible, non-silent). This is the exact
 *     silent-swallow bug from Sprint 2 device QA.
 *   - A transient failure (network / 5xx) → { ok: true, queued: true } and the
 *     row stays `pending` so the sync engine retries — the offline-first
 *     contract still holds.
 *   - A clean server accept → { ok: true, queued: false }.
 *
 * The real localStore runs over a stateful AsyncStorage mock (same approach as
 * the syncEngine suite) so we can assert the row's true sync state.
 */
import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { DataProvider, useData } from '../DataContext';
import { localStore } from '../../lib/localStore';
import * as txnApi from '../../api/transactions';

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

// ApiError is the branch signal addTransaction keys on; provide a real class
// without pulling in the heavy client.ts (supabase/securestore) dependency tree.
jest.mock('../../api/client', () => {
  class ApiError extends Error {
    status: number;
    body: unknown;
    constructor(status: number, message: string, body?: unknown) {
      super(message);
      this.name = 'ApiError';
      this.status = status;
      this.body = body;
    }
  }
  return { __esModule: true, ApiError };
});

jest.mock('../../api/transactions', () => ({
  addTransaction: jest.fn(),
  deleteTransaction: jest.fn(),
  updateTransaction: jest.fn(),
  getTransactions: jest.fn(),
  getSummary: jest.fn().mockResolvedValue(null),
}));

// Keep the provider's background machinery inert.
jest.mock('../../lib/syncEngine', () => ({
  flushPending: jest.fn().mockResolvedValue({ changed: false }),
  startAutoFlush: jest.fn(() => () => {}),
}));
jest.mock('../../lib/recurringEngine', () => ({
  checkAndGenerateDue: jest.fn().mockResolvedValue([]),
}));
jest.mock('../../hooks/useOfflineCache', () => ({
  useOfflineCache: () => ({
    fetchWithCache: (_key: string, fn: () => unknown) => fn(),
  }),
}));
jest.mock('../../lib/analytics', () => ({
  track: jest.fn(),
  bucketAmount: jest.fn(() => '100-500'),
}));
jest.mock('../../config/sentry', () => ({ addBreadcrumb: jest.fn() }));

const { ApiError } = jest.requireMock('../../api/client') as {
  ApiError: new (s: number, m: string, b?: unknown) => Error;
};

const input = {
  type: 'expense',
  amount: 200,
  category: 'food',
  description: 'lunch',
  note: '',
  date: '2026-07-03',
};

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <DataProvider>{children}</DataProvider>
);

beforeEach(async () => {
  await localStore.clear();
  jest.clearAllMocks();
});

describe('DataContext.addTransaction — no silent failures (B1)', () => {
  it('surfaces a permanent 4xx rejection and marks the row failed', async () => {
    (txnApi.addTransaction as jest.Mock).mockRejectedValue(
      new ApiError(400, 'amount must be positive')
    );

    const { result } = renderHook(() => useData(), { wrapper });

    let outcome: Awaited<ReturnType<typeof result.current.addTransaction>>;
    await act(async () => {
      outcome = await result.current.addTransaction(input);
    });

    expect(outcome!.ok).toBe(false);
    if (!outcome!.ok) expect(outcome!.message).toMatch(/amount must be positive/);

    // The row was NOT dropped — it's persisted and flagged failed, not synced.
    const pending = await localStore.getPending();
    expect(pending).toHaveLength(1);
    expect(pending[0].syncStatus).toBe('failed');
  });

  it('treats a network/5xx failure as safely queued for retry', async () => {
    (txnApi.addTransaction as jest.Mock).mockRejectedValue(
      new ApiError(503, 'service unavailable')
    );

    const { result } = renderHook(() => useData(), { wrapper });

    let outcome: Awaited<ReturnType<typeof result.current.addTransaction>>;
    await act(async () => {
      outcome = await result.current.addTransaction(input);
    });

    expect(outcome!.ok).toBe(true);
    if (outcome!.ok) expect(outcome!.queued).toBe(true);

    const pending = await localStore.getPending();
    expect(pending).toHaveLength(1);
    expect(pending[0].syncStatus).toBe('pending'); // still retryable
  });

  it('confirms a clean save with queued=false', async () => {
    (txnApi.addTransaction as jest.Mock).mockResolvedValue({
      id: 'uuid-1',
      userId: 'u1',
      updatedAt: '2026-07-03T10:00:00Z',
    });

    const { result } = renderHook(() => useData(), { wrapper });

    let outcome: Awaited<ReturnType<typeof result.current.addTransaction>>;
    await act(async () => {
      outcome = await result.current.addTransaction(input);
    });

    expect(outcome!.ok).toBe(true);
    if (outcome!.ok) expect(outcome!.queued).toBe(false);

    const pending = await localStore.getPending();
    expect(pending).toHaveLength(0); // synced → nothing left to reconcile
  });

  it('surfaces a permanent 4xx rejection on the edit path too', async () => {
    // Seed a synced row via a successful add.
    (txnApi.addTransaction as jest.Mock).mockResolvedValue({
      id: 'uuid-1',
      userId: 'u1',
      updatedAt: '2026-07-03T10:00:00Z',
    });
    const { result } = renderHook(() => useData(), { wrapper });
    await act(async () => {
      await result.current.addTransaction(input);
    });
    const [row] = await localStore.getAll();

    // Now the edit is permanently rejected by the server.
    (txnApi.updateTransaction as jest.Mock).mockRejectedValue(
      new ApiError(422, 'category invalid')
    );

    let outcome: Awaited<ReturnType<typeof result.current.updateTransaction>>;
    await act(async () => {
      outcome = await result.current.updateTransaction(row.id, { amount: 999 });
    });

    expect(outcome!.ok).toBe(false);
    if (!outcome!.ok) expect(outcome!.message).toMatch(/category invalid/);

    const pending = await localStore.getPending();
    expect(pending).toHaveLength(1);
    expect(pending[0].syncStatus).toBe('failed'); // edit flagged, not silently lost
  });

  it('keeps a 409 edit conflict calm for the engine to reconcile', async () => {
    (txnApi.addTransaction as jest.Mock).mockResolvedValue({
      id: 'uuid-1',
      userId: 'u1',
      updatedAt: '2026-07-03T10:00:00Z',
    });
    const { result } = renderHook(() => useData(), { wrapper });
    await act(async () => {
      await result.current.addTransaction(input);
    });
    const [row] = await localStore.getAll();

    (txnApi.updateTransaction as jest.Mock).mockRejectedValue(
      new ApiError(409, 'stale baseline')
    );

    let outcome: Awaited<ReturnType<typeof result.current.updateTransaction>>;
    await act(async () => {
      outcome = await result.current.updateTransaction(row.id, { amount: 999 });
    });

    // Not a user-facing failure — the conflict pass owns it.
    expect(outcome!.ok).toBe(true);
    if (outcome!.ok) expect(outcome!.queued).toBe(true);
  });
});
