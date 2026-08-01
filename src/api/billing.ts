import { apiRequest } from './client';

export interface ReconcileResult {
  tier: string;
  pro: boolean;
}

/**
 * Ask the backend to verify our RevenueCat entitlement server-side and repair
 * the stored tier if a webhook was missed. 503 when the server has no
 * RevenueCat secret key configured — callers should treat that as "no-op".
 */
export const reconcileEntitlement = () =>
  apiRequest<ReconcileResult>('/billing/reconcile', { method: 'POST' });
