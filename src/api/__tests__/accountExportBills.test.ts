import { exportMyData } from '../auth';
import { apiRequest } from '../client';
import { currentBillAccount, exportOwnedBills } from '../../lib/bills';
import { observeRequestAccount, resetRequestSession } from '../../lib/requestSession';
jest.mock('../client', () => ({ apiRequest: jest.fn() }));
jest.mock('../../lib/bills', () => ({ currentBillAccount: jest.fn(), exportOwnedBills: jest.fn() }));
beforeEach(() => {
  jest.clearAllMocks(); resetRequestSession(); observeRequestAccount('owner-a');
  jest.mocked(currentBillAccount).mockReturnValue('owner-a');
  jest.mocked(exportOwnedBills).mockResolvedValue({ ownerId: 'owner-a', bills: [{ id: 'owned-bill' } as never] });
  jest.mocked(apiRequest).mockResolvedValue({ profile: { id: 'owner-a' }, transactions: [] });
});
it('includes only the captured owner bill snapshot with explicit export exclusions', async () => {
  const result = await exportMyData();
  expect(result.localBills).toEqual([{ id: 'owned-bill' }]);
  expect(result.exportScope).toMatchObject({ currentDeviceOwnedBills: true, unassignedLegacyBills: false, otherDeviceBills: false, unsyncedTransactionsIncluded: false, atomicAcrossServerAndDevice: false });
});
it('rejects an account transition even if the original account is restored before completion', async () => {
  jest.mocked(apiRequest).mockImplementationOnce(async () => {
    observeRequestAccount('owner-b'); observeRequestAccount('owner-a');
    return { profile: { id: 'owner-a' } } as never;
  });
  await expect(exportMyData()).rejects.toThrow('Export account changed');
});
it('refuses another owner response or local snapshot rather than combining accounts', async () => {
  jest.mocked(exportOwnedBills).mockResolvedValueOnce({ ownerId: 'owner-b', bills: [] });
  await expect(exportMyData()).rejects.toThrow('Export account changed');
});
it('does not silently export an empty bills list after local storage failure', async () => {
  jest.mocked(exportOwnedBills).mockRejectedValueOnce(new Error('storage unavailable'));
  await expect(exportMyData()).rejects.toThrow('storage unavailable');
});
