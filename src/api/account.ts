import { deleteAccountRequest } from './client';
import { currentBillAccount, eraseDeletedAccountBills } from '../lib/bills';
import { requestAccountId } from '../lib/requestSession';

export const deleteAccount = async (password: string) => {
  const owner = currentBillAccount();
  if (!owner || owner !== requestAccountId()) throw new Error('Account identity must be verified before deletion');
  let localBillCleanupComplete = false;
  const result = await deleteAccountRequest(password, async () => {
    try { await eraseDeletedAccountBills(owner); localBillCleanupComplete = true; }
    catch { /* Server deletion succeeded; report local cleanup separately. */ }
  });
  return { ...result, localBillCleanupComplete };
};
