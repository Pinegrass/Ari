import { apiRequest } from './client';
export interface NotificationPreferences {
  push: boolean; inApp: boolean;
  categories: { reports: boolean; spending: boolean; bills: boolean; habit: boolean };
  maxPerWeek: number; quietStart: number; quietEnd: number; timezone: string; language: 'en' | 'hi';
}
export const getNotificationPreferences = () => apiRequest<NotificationPreferences>('/engagement/notification-preferences');
export const saveNotificationPreferences = (settings: NotificationPreferences) => apiRequest<NotificationPreferences>('/engagement/notification-preferences', { method: 'PATCH', body: JSON.stringify(settings) });
