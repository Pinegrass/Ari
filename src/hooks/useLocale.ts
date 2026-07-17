import { useAuth } from '../context/AuthContext';
import { formatCurrency as fmtCurrency, getLocale } from '../utils/locale';
import type { LocaleInfo } from '../utils/locale';

/**
 * Convenience hook that provides locale-aware formatting functions
 * bound to the current user's country. Falls back to IN (India).
 *
 * Usage:
 *   const { formatCurrency, formatDate, locale } = useLocale();
 *   formatCurrency(125000);       // "₹1,25,000" or "$125,000"
 *   formatDate(new Date());       // "18 July 2026" (en-IN) or "July 18, 2026" (en-US)
 */
export function useLocale() {
  const { user } = useAuth();
  const locale = getLocale(user?.country);

  return {
    locale,
    /** Format amount with the user's currency symbol and numbering system. */
    formatCurrency: (amount: number) => fmtCurrency(amount, locale),
    /** Format a date using the user's locale. */
    formatDate: (date: Date, options?: Intl.DateTimeFormatOptions) =>
      date.toLocaleDateString(locale.localeTag, options),
  };
}

export type { LocaleInfo };
