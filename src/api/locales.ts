import type { LocaleInfo } from '../utils/locale';
import { apiRequest } from './client';

interface LocaleResponse {
  locales: LocaleInfo[];
}

export async function getSupportedLocales(): Promise<LocaleInfo[]> {
  const data = await apiRequest<LocaleResponse>('/locales');
  return data.locales;
}
