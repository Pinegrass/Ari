import { buildUpiUri, formatUpiAmount } from '../upi';

describe('formatUpiAmount', () => {
  it('emits whole rupees without a paise suffix', () => {
    expect(formatUpiAmount(450)).toBe('450');
    expect(formatUpiAmount(1)).toBe('1');
    expect(formatUpiAmount(100000)).toBe('100000');
  });

  it('fixes fractional amounts to 2 decimals', () => {
    expect(formatUpiAmount(450.5)).toBe('450.50');
    expect(formatUpiAmount(12.345)).toBe('12.35');
  });

  it('throws on non-positive or non-finite amounts', () => {
    expect(() => formatUpiAmount(0)).toThrow();
    expect(() => formatUpiAmount(-10)).toThrow();
    expect(() => formatUpiAmount(NaN)).toThrow();
    expect(() => formatUpiAmount(Infinity)).toThrow();
  });
});

describe('buildUpiUri', () => {
  it('builds a well-formed upi://pay link with the core params', () => {
    const uri = buildUpiUri({ vpa: 'ejaj@okhdfcbank', payeeName: 'Ejaj', amount: 450 });
    expect(uri).toBe('upi://pay?pa=ejaj@okhdfcbank&pn=Ejaj&am=450&cu=INR');
  });

  it('preserves the literal @ in the VPA (not percent-encoded)', () => {
    const uri = buildUpiUri({ vpa: 'name@okaxis', payeeName: 'N', amount: 5 });
    expect(uri).toContain('pa=name@okaxis');
    expect(uri).not.toContain('%40');
  });

  it('URL-encodes the payee name with %20 for spaces (not +)', () => {
    const uri = buildUpiUri({ vpa: 'a@b', payeeName: 'Priya Sharma', amount: 5 });
    expect(uri).toContain('pn=Priya%20Sharma');
    expect(uri).not.toContain('+');
  });

  it('includes and encodes the note when provided', () => {
    const uri = buildUpiUri({
      vpa: 'a@b', payeeName: 'A', amount: 200, note: 'Ari · Goa trip',
    });
    expect(uri).toContain('tn=Ari%20%C2%B7%20Goa%20trip');
  });

  it('omits the note param when absent', () => {
    const uri = buildUpiUri({ vpa: 'a@b', payeeName: 'A', amount: 1 });
    expect(uri).not.toContain('tn=');
  });

  it('formats the amount inside the URI', () => {
    const uri = buildUpiUri({ vpa: 'a@b', payeeName: 'A', amount: 99.9 });
    expect(uri).toContain('am=99.90');
  });

  it('defaults currency to INR but honours an override', () => {
    expect(buildUpiUri({ vpa: 'a@b', payeeName: 'A', amount: 1 })).toContain('cu=INR');
    expect(
      buildUpiUri({ vpa: 'a@b', payeeName: 'A', amount: 1, currency: 'USD' }),
    ).toContain('cu=USD');
  });

  it('throws when the VPA is missing or blank', () => {
    expect(() => buildUpiUri({ vpa: '', payeeName: 'A', amount: 1 })).toThrow();
    expect(() => buildUpiUri({ vpa: '   ', payeeName: 'A', amount: 1 })).toThrow();
  });

  it('propagates the amount validation (no malformed payment sheet)', () => {
    expect(() => buildUpiUri({ vpa: 'a@b', payeeName: 'A', amount: 0 })).toThrow();
  });
});
