import { apiRequest } from './client';

// Setu Account Aggregator API (backend routes/aa.py). The backend gates every
// mutating endpoint behind SETU_ENABLED=1; while it's off, /aa/status still
// returns 200 with `enabled: false` so the UI can hide the Link-bank surface.

export interface AaStatus {
  enabled: boolean;
  linked: boolean;
  linkedAt: string | null;
  provider: string;
}

export interface AaConsentSummary {
  id: string;
  consentHandle: string;
  consentId: string | null;
  status: string;
  fiTypes: string[];
  lastFetchedAt: string | null;
  createdAt: string;
}

export interface AaConsentDetail {
  consentId: string;
  consentHandle: string;
  status: string;
  fiTypes: string[];
}

export interface AaConsentCreated {
  consentId: string;
  consentHandle: string;
  redirectUrl: string;
  status: string;
}

export interface AaSyncResult {
  sessionId: string;
  status: string;
  imported?: number;
  duplicates?: number;
}

export const getAaStatus = () => apiRequest<AaStatus>('/aa/status');

export const createAaConsent = (vua: string, fiTypes: string[] = ['DEPOSIT']) =>
  apiRequest<AaConsentCreated>('/aa/consent', {
    method: 'POST',
    body: JSON.stringify({ vua, fiTypes }),
  });

export const getAaConsents = () => apiRequest<{ consents: AaConsentSummary[] }>('/aa/consents');

export const getAaConsent = (consentHandle: string) =>
  apiRequest<AaConsentDetail>(`/aa/consent/${encodeURIComponent(consentHandle)}`);

export const syncAaConsent = (consentHandle: string) =>
  apiRequest<AaSyncResult>(`/aa/sync/${encodeURIComponent(consentHandle)}`, {
    method: 'POST',
  });
