import { deleteAccount } from '../account';
import { deleteAccountRequest } from '../client';
import { currentBillAccount, eraseDeletedAccountBills } from '../../lib/bills';
import { observeRequestAccount, resetRequestSession } from '../../lib/requestSession';
jest.mock('../client', () => ({ deleteAccountRequest: jest.fn() }));
jest.mock('../../lib/bills', () => ({ currentBillAccount: jest.fn(), eraseDeletedAccountBills: jest.fn().mockResolvedValue(undefined) }));
beforeEach(() => {
  jest.clearAllMocks(); resetRequestSession(); observeRequestAccount('owner-a');
  jest.mocked(currentBillAccount).mockReturnValue('owner-a');
  jest.mocked(deleteAccountRequest).mockImplementation(async (_password, confirmed) => { await confirmed(); return { message: 'deleted' }; });
});
it('does not erase local bills on rejected or uncertain server deletion', async () => {
  jest.mocked(deleteAccountRequest).mockRejectedValueOnce(new Error('offline'));
  await expect(deleteAccount('password')).rejects.toThrow('offline');
  expect(eraseDeletedAccountBills).not.toHaveBeenCalled();
});
it('captures owner before server deletion can sign out or switch the account', async () => {
  jest.mocked(deleteAccountRequest).mockImplementationOnce(async (_password, confirmed) => {
    jest.mocked(currentBillAccount).mockReturnValue('owner-b');
    await confirmed();
    return { message: 'deleted' } as never;
  });
  await deleteAccount('password');
  expect(eraseDeletedAccountBills).toHaveBeenCalledWith('owner-a');
});

it('reports local cleanup failure separately without retrying a confirmed server deletion', async () => {
  jest.mocked(eraseDeletedAccountBills).mockRejectedValueOnce(new Error('storage unavailable'));
  expect(await deleteAccount('password')).toEqual({ message: 'deleted', localBillCleanupComplete: false });
  expect(deleteAccountRequest).toHaveBeenCalledTimes(1);
});

it('does not claim cleanup or guess an owner when only an unverified session was cached', async () => {
  jest.mocked(currentBillAccount).mockReturnValueOnce(null);
  await expect(deleteAccount('password')).rejects.toThrow('identity must be verified');
  expect(deleteAccountRequest).not.toHaveBeenCalled();
  expect(eraseDeletedAccountBills).not.toHaveBeenCalled();
});

it('refuses mismatched bound bill owner and request account before sending deletion', async () => {
  observeRequestAccount('owner-b');
  await expect(deleteAccount('password')).rejects.toThrow('identity must be verified');
  expect(deleteAccountRequest).not.toHaveBeenCalled();
});
