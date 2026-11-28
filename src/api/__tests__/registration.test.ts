import { register } from '../auth';
import { apiRequest } from '../client';
import contract from '../../../contracts/email-registration-v1.json';
import type { RegisterPayload } from '../../types';

jest.mock('../client', () => ({ apiRequest: jest.fn() }));
jest.mock('../../lib/bills', () => ({ currentBillAccount: jest.fn(), exportOwnedBills: jest.fn() }));

beforeEach(() => jest.clearAllMocks());

it.each([contract.pending, contract.unexpectedSession])('keeps verification separate from credentials', async body => {
  jest.mocked(apiRequest).mockResolvedValue(body);
  await expect(register(contract.request as RegisterPayload)).resolves.toEqual({ verificationRequired: true });
  const [, options] = jest.mocked(apiRequest).mock.calls[0];
  expect(JSON.parse(options!.body as string).registrationContract).toBe(contract.contract);
});

it('preserves the legacy session response during the client-first rollout', async () => {
  jest.mocked(apiRequest).mockResolvedValue(contract.legacySession);
  await expect(register(contract.request as RegisterPayload)).resolves.toEqual(contract.legacySession);
});

it.each([null, {}, { token: 'fixture-only' }, { user: { id: 'fixture' } }])('rejects malformed success before context can store credentials', async body => {
  jest.mocked(apiRequest).mockResolvedValue(body);
  await expect(register(contract.request as RegisterPayload)).rejects.toThrow('Invalid registration response');
});
