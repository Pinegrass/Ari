/**
 * Frontend locale engine — mirrors backend locale_config.py.
 * All currency formatting and locale data flows through this module.
 *
 * Usage:
 *   import { formatCurrency, getLocale, LOCALES } from '../utils/locale';
 *   const loc = getLocale(user.country);
 *   formatCurrency(125000, loc); // "$1,250.00" or "₹1,25,000"
 */

export interface LocaleInfo {
  code: string;          // ISO 3166-1 alpha-2, e.g. "IN", "US"
  name: string;          // Display name, e.g. "India"
  currency: string;       // ISO 4217, e.g. "INR", "USD"
  symbol: string;         // e.g. "₹", "$", "£"
  localeTag: string;      // BCP-47 locale, e.g. "en-IN"
  numberingSystem: 'indian' | 'western';
  incomeBrackets: IncomeBracket[];
}

export interface IncomeBracket {
  label: string;
  min: number;
  max: number | null;
  value: string;  // machine-readable key
}

// ── Locale Registry ─────────────────────────────────────────────────────────

const LOCALE_DATA: Record<string, Omit<LocaleInfo, 'code' | 'incomeBrackets'> & { incomeBrackets: Omit<IncomeBracket, 'value'>[] }> = {
  IN: {
    name: 'India',
    currency: 'INR',
    symbol: '₹',
    localeTag: 'en-IN',
    numberingSystem: 'indian',
    incomeBrackets: [
      { label: 'Under ₹15K', min: 0, max: 14999 },
      { label: '₹15K – ₹30K', min: 15000, max: 30000 },
      { label: '₹30K – ₹60K', min: 30001, max: 60000 },
      { label: '₹60K – ₹1L', min: 60001, max: 100000 },
      { label: '₹1L+', min: 100001, max: null },
    ],
  },
  US: {
    name: 'United States',
    currency: 'USD',
    symbol: '$',
    localeTag: 'en-US',
    numberingSystem: 'western',
    incomeBrackets: [
      { label: 'Under $2K', min: 0, max: 1999 },
      { label: '$2K – $5K', min: 2000, max: 5000 },
      { label: '$5K – $10K', min: 5001, max: 10000 },
      { label: '$10K – $20K', min: 10001, max: 20000 },
      { label: '$20K+', min: 20001, max: null },
    ],
  },
  GB: {
    name: 'United Kingdom',
    currency: 'GBP',
    symbol: '£',
    localeTag: 'en-GB',
    numberingSystem: 'western',
    incomeBrackets: [
      { label: 'Under £1.5K', min: 0, max: 1499 },
      { label: '£1.5K – £3K', min: 1500, max: 3000 },
      { label: '£3K – £5K', min: 3001, max: 5000 },
      { label: '£5K – £10K', min: 5001, max: 10000 },
      { label: '£10K+', min: 10001, max: null },
    ],
  },
  AU: {
    name: 'Australia',
    currency: 'AUD',
    symbol: '$',
    localeTag: 'en-AU',
    numberingSystem: 'western',
    incomeBrackets: [
      { label: 'Under $2K', min: 0, max: 1999 },
      { label: '$2K – $5K', min: 2000, max: 5000 },
      { label: '$5K – $10K', min: 5001, max: 10000 },
      { label: '$10K – $20K', min: 10001, max: 20000 },
      { label: '$20K+', min: 20001, max: null },
    ],
  },
};

// Fallback locale
const GLOBAL_LOCALE: Omit<LocaleInfo, 'code' | 'incomeBrackets'> & { incomeBrackets: Omit<IncomeBracket, 'value'>[] } = {
  name: 'Global',
  currency: 'USD',
  symbol: '$',
  localeTag: 'en-US',
  numberingSystem: 'western',
  incomeBrackets: [
    { label: 'Under $1K', min: 0, max: 999 },
    { label: '$1K – $3K', min: 1000, max: 3000 },
    { label: '$3K – $6K', min: 3001, max: 6000 },
    { label: '$6K – $12K', min: 6001, max: 12000 },
    { label: '$12K+', min: 12001, max: null },
  ],
};

function buildLocale(code: string): LocaleInfo {
  const data = LOCALE_DATA[code] ?? GLOBAL_LOCALE;
  return {
    code,
    ...data,
    incomeBrackets: data.incomeBrackets.map((b, i) => ({
      ...b,
      value: `bracket_${i}`,
    })),
  };
}

// ── Public API ──────────────────────────────────────────────────────────────

export const SUPPORTED_COUNTRIES: string[] = Object.keys(LOCALE_DATA);

export function getLocale(countryCode: string | null | undefined): LocaleInfo {
  const code = (countryCode || '').toUpperCase();
  return buildLocale(code in LOCALE_DATA ? code : 'GLOBAL');
}

export function formatCurrency(amount: number, locale?: LocaleInfo | string | null): string {
  const loc = typeof locale === 'string' || !locale
    ? getLocale(typeof locale === 'string' ? locale : null)
    : locale;

  const a = Math.abs(amount);  // formatCurrency always shows absolute value

  if (loc.numberingSystem === 'indian' && a >= 100000) {
    return loc.symbol + formatIndian(a);
  }

  return loc.symbol + formatWestern(a);
}

/**
 * Standard Western numbering: 1,250,000
 */
function formatWestern(amount: number): string {
  return amount.toLocaleString('en-US', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  });
}

/**
 * Indian numbering: 12,50,000 (lakhs, crores)
 * 125000 → "1,25,000"
 * 1500000 → "15,00,000"
 */
function formatIndian(amount: number): string {
  const s = String(amount);
  if (s.length <= 3) return s;

  const last3 = s.slice(-3);
  let rest = s.slice(0, -3);
  const groups: string[] = [last3];

  while (rest.length > 0) {
    groups.unshift(rest.slice(-2));
    rest = rest.slice(0, -2);
  }

  return groups.join(',');
}

/**
 * Format currency with the full sign-aware display (e.g. "-₹500")
 */
export function formatCurrencyFull(amount: number, locale?: LocaleInfo | string | null): string {
  const loc = typeof locale === 'string' || !locale
    ? getLocale(typeof locale === 'string' ? locale : null)
    : locale;

  const sign = amount < 0 ? '-' : '';
  const a = Math.abs(amount);

  if (loc.numberingSystem === 'indian' && a >= 100000) {
    return sign + loc.symbol + formatIndian(a);
  }

  return sign + loc.symbol + formatWestern(a);
}

/**
 * Select the income bracket that matches a given monthly amount.
 */
export function getIncomeBracket(amount: number, locale?: LocaleInfo | string | null): IncomeBracket | null {
  const loc = typeof locale === 'string' || !locale
    ? getLocale(typeof locale === 'string' ? locale : null)
    : locale;

  return loc.incomeBrackets.find(
    (b) => amount >= b.min && (b.max === null || amount <= b.max)
  ) ?? null;
}
