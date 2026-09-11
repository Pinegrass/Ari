import { apiRequest } from './client';
import type { ChatMessage, Nudge, Insight } from '../types';
import { scrubPII } from '../utils/piiFilter';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const chatWithTomo = async (message: string, history: ChatMessage[]) => {
  const language = await AsyncStorage.getItem('ari_language').catch(() => null) === 'hi' ? 'hi' : 'en';
  // Spec §7 — MANDATORY: strip cards/accounts/OTPs/passwords before any AI call.
  const scrubbedMessage = scrubPII(message);
  const scrubbedHistory = history.slice(-8).map((m) =>
    m.role === 'user' ? { ...m, content: scrubPII(m.content) } : m,
  );
  return apiRequest<{ response: string }>('/tomo/chat', {
    method: 'POST',
    headers: { 'Accept-Language': language },
    body: JSON.stringify({ message: scrubbedMessage, history: scrubbedHistory }),
  });
};

export const getNudge = () => apiRequest<Nudge | null>('/tomo/nudge');

export const getInsights = () => apiRequest<{ insights: Insight[] }>('/insights');
