/**
 * Currency formatting — delegates to the locale engine.
 * All existing imports of formatCurrency / formatCurrencyFull continue to work.
 *
 * For new code, prefer the useLocale() hook from '../hooks/useLocale'.
 */

import { formatCurrency as localeFormat, formatCurrencyFull as localeFormatFull } from './locale';
import type { LocaleInfo } from './locale';

/** @deprecated Use useLocale() hook instead. */
export const formatCurrency = (amount: number, locale?: LocaleInfo | string | null): string => {
  return localeFormat(amount, locale ?? 'IN');
};

/** @deprecated Use useLocale() hook instead. */
export const formatCurrencyFull = (amount: number, locale?: LocaleInfo | string | null): string => {
  return localeFormatFull(amount, locale ?? 'IN');
};
