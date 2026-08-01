import { formatCurrency, formatCurrencyFull, parseAmountInput, getLocale } from '../locale';

describe('locale engine — decimals', () => {
  it('INR renders whole units with Indian grouping', () => {
    expect(formatCurrency(125000, 'IN')).toBe('₹1,25,000');
  });

  it('INR never renders paise', () => {
    expect(formatCurrency(1250.5, 'IN')).toBe('₹1,250');
  });

  it('USD renders cents with 2 decimals', () => {
    expect(formatCurrency(1250.5, 'US')).toBe('$1,250.50');
    expect(formatCurrency(42.3, 'US')).toBe('$42.30');
  });

  it('USD whole amounts render without decimals', () => {
    expect(formatCurrency(1250, 'US')).toBe('$1,250');
  });

  it('GBP and AUD render cents', () => {
    expect(formatCurrency(950.75, 'GB')).toBe('£950.75');
    expect(formatCurrency(10.05, 'AU')).toBe('$10.05');
  });

  it('cents rounding carries across the unit boundary', () => {
    expect(formatCurrency(4.999, 'US')).toBe('$5');
  });

  it('formatCurrencyFull keeps the sign with decimals', () => {
    expect(formatCurrencyFull(-42.3, 'US')).toBe('-$42.30');
    expect(formatCurrencyFull(-500, 'IN')).toBe('-₹500');
  });

  it('falls back to the GLOBAL locale for unknown countries', () => {
    expect(formatCurrency(100.5, 'ZZ')).toBe('$100.50');
  });
});

describe('locale engine — decimal flags', () => {
  it('INR is whole-unit, cents locales are decimal', () => {
    expect(getLocale('IN').usesDecimalAmounts).toBe(false);
    for (const code of ['US', 'GB', 'AU']) {
      expect(getLocale(code).usesDecimalAmounts).toBe(true);
    }
    expect(getLocale(null).usesDecimalAmounts).toBe(true); // GLOBAL fallback
  });
});

describe('parseAmountInput', () => {
  it('accepts whole amounts everywhere', () => {
    expect(parseAmountInput('500', 'IN')).toBe(500);
    expect(parseAmountInput('500', 'US')).toBe(500);
  });

  it('rejects decimals for INR', () => {
    expect(parseAmountInput('10.50', 'IN')).toBeNull();
  });

  it('accepts up to 2 decimals for cents locales', () => {
    expect(parseAmountInput('10.50', 'US')).toBe(10.5);
    expect(parseAmountInput('10.5', 'GB')).toBe(10.5);
  });

  it('rejects 3 decimal places', () => {
    expect(parseAmountInput('10.505', 'US')).toBeNull();
  });

  it('rejects junk and non-positive input', () => {
    for (const bad of ['', '.', 'abc', '-5', '0', '1.2.3', '12a']) {
      expect(parseAmountInput(bad, 'US')).toBeNull();
    }
  });

  it('treats a trailing dot as the whole amount', () => {
    expect(parseAmountInput('12.', 'US')).toBe(12);
  });
});
