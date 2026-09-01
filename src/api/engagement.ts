import { apiRequest } from './client';

export interface EngagementSummary {
  lifecycle: 'new' | 'engaged' | 'cooling' | 'dormant';
  headline: string;
  daysInactive: number;
  lastActivityDate: string | null;
  currentStreak: number;
  transactionCount: number;
  nextMilestone: number;
  milestoneProgress: number;
  recommendedAction: 'add_transaction' | 'open_report';
}

export interface ReferralStatus {
  code: string;
  inviteUrl: string;
  shares: number;
  accepted: number;
  nextGoal: number;
  progress: number;
  badge: string | null;
}

export const getEngagementSummary = () =>
  apiRequest<EngagementSummary>('/engagement/summary');

export const getReferralStatus = () =>
  apiRequest<ReferralStatus>('/referrals/status');

export const recordReferralShare = () =>
  apiRequest<{ ok: true; shares: number }>('/referrals/share', { method: 'POST' });

export const redeemReferral = (code: string) =>
  apiRequest<{ ok: true; inviterName: string }>('/referrals/redeem', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
