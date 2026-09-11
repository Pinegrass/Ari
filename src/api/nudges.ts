import { apiRequest } from './client';
export interface InboxNudge {
  id: string; title: string; body: string; category: 'reports'|'spending'|'bills'|'habit';
  action: 'report'|'recurring'|'entries'; period: 'weekly'|'monthly'|null; anchor: string|null;
}
export const getNudgeInbox = (language: 'en'|'hi') => apiRequest<{items: InboxNudge[]}>(`/engagement/nudges?language=${language}`);
export const dismissInboxNudge = (id: string) => apiRequest('/engagement/nudges/'+encodeURIComponent(id)+'/dismiss', {method:'POST'});
