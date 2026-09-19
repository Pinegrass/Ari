import { apiRequest } from './client';
import type { User, RegisterPayload } from '../types';
import { currentBillAccount, exportOwnedBills } from '../lib/bills';
import { requestAccountId, requestSessionRevision } from '../lib/requestSession';

// refresh_token is optional so the frontend keeps working against a backend
// that hasn't been redeployed with the refresh_token field yet. The Supabase
// auto-refresh path is a no-op in that case; user just sees the legacy 1h
// access_token TTL until backend catches up.
export interface AuthSessionResponse {
  token: string;
  refresh_token?: string;
  user: User;
}

export const login = (email: string, password: string) =>
  apiRequest<AuthSessionResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

export const register = (payload: RegisterPayload) =>
  apiRequest<AuthSessionResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const getMe = () => apiRequest<User>('/auth/me');

/** Server account records plus this device's verified-owner local bills. */
export interface DataExport {
  exported_at: string;
  profile: User;
  transactions: unknown[];
  budgets: unknown[];
  savings_goals: unknown[];
  tax_profile: unknown | null;
  categories: unknown[];
  todo_notes: unknown[];
  feedback: unknown[];
}

export const exportMyData = async () => {
  const owner = currentBillAccount();
  const revision = requestSessionRevision();
  if (!owner || requestAccountId() !== owner) throw new Error('Export account unavailable');
  const [data, local] = await Promise.all([apiRequest<DataExport>('/auth/export'), exportOwnedBills()]);
  if (requestSessionRevision() !== revision || requestAccountId() !== owner
      || currentBillAccount() !== owner || local.ownerId !== owner || data.profile.id !== owner) {
    throw new Error('Export account changed');
  }
  return { ...data, localBills: local.bills, exportScope: {
    serverAccountRecords: true, currentDeviceOwnedBills: true,
    otherDeviceBills: false, unassignedLegacyBills: false, unsyncedTransactionsIncluded: false,
    atomicAcrossServerAndDevice: false,
  } };
};

export interface PatchMePayload {
  name?: string;
  upiVpa?: string | null;
  monthlyIncome?: number | null;
  /** ISO 3166-1 alpha-2. Backend also syncs `currency` to the new locale. */
  country?: string;
}

/** PATCH /api/auth/me — update a small subset of profile fields. */
export const patchMe = (payload: PatchMePayload) =>
  apiRequest<User>('/auth/me', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
