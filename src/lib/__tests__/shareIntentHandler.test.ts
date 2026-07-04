import { sharedTextFromIntent } from '../shareIntentHandler';

// parseShareLink (the ari://share deep-link fallback) is exercised on-device;
// it depends on expo-linking's native host-URI resolution which isn't available
// under Jest, so it is intentionally not unit-tested here.

describe('sharedTextFromIntent', () => {
  it('returns the shared text for an ACTION_SEND text payload', () => {
    expect(
      sharedTextFromIntent({ text: 'Paid 450 to Swiggy via UPI', webUrl: null }),
    ).toBe('Paid 450 to Swiggy via UPI');
  });

  it('trims surrounding whitespace', () => {
    expect(sharedTextFromIntent({ text: '  ₹1200 rent  ' })).toBe('₹1200 rent');
  });

  it('falls back to webUrl when there is no text', () => {
    expect(
      sharedTextFromIntent({ text: null, webUrl: 'https://pay.example/receipt/9' }),
    ).toBe('https://pay.example/receipt/9');
  });

  it('prefers text over webUrl when both are present', () => {
    expect(
      sharedTextFromIntent({ text: 'Zomato 320', webUrl: 'https://z.co' }),
    ).toBe('Zomato 320');
  });

  it('returns null for empty / whitespace-only / missing payloads', () => {
    expect(sharedTextFromIntent(null)).toBeNull();
    expect(sharedTextFromIntent(undefined)).toBeNull();
    expect(sharedTextFromIntent({ text: '   ', webUrl: '' })).toBeNull();
    expect(sharedTextFromIntent({})).toBeNull();
  });
});
