/**
 * UPI deep-link (intent) builder for group settle-up.
 *
 * Produces a `upi://pay?...` URI per the NPCI UPI Linking Specification. Any
 * installed UPI app (GPay / PhonePe / Paytm / BHIM) resolves it and pre-fills
 * the payee + amount. Pure and side-effect free — the screen owns Linking.
 */

export interface UpiIntentParams {
  /** Payee VPA / UPI ID, e.g. "ejaj@okhdfcbank" (maps to `pa`). */
  vpa: string;
  /** Payee display name (maps to `pn`). */
  payeeName: string;
  /** Amount in INR (maps to `am`). */
  amount: number;
  /** Optional transaction note (maps to `tn`). */
  note?: string;
  /** Currency code (maps to `cu`). Defaults to INR. */
  currency?: string;
}

/**
 * Format an INR amount for the UPI `am` param. UPI accepts up to 2 decimals;
 * Ari deals in whole rupees, so integers emit without a paise suffix and any
 * fractional value is fixed to 2 dp. Throws on non-positive / non-finite input
 * so a bad amount can never open a malformed payment sheet.
 */
export function formatUpiAmount(amount: number): string {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('UPI amount must be a positive, finite number');
  }
  return Number.isInteger(amount) ? String(amount) : amount.toFixed(2);
}

/**
 * Encode a query value with encodeURIComponent, but preserve the `@` and `.`
 * that are legal and expected inside a VPA — some UPI apps fail to decode a
 * percent-encoded `@` in `pa`. Spaces still become %20 (not `+`).
 */
function encodeVpa(vpa: string): string {
  return encodeURIComponent(vpa).replace(/%40/g, '@');
}

/**
 * Build a `upi://pay` deep link. Values are URL-encoded (spaces → %20). The VPA
 * keeps its literal `@`. Throws if the VPA is empty or the amount is invalid.
 */
export function buildUpiUri(params: UpiIntentParams): string {
  const vpa = params.vpa?.trim();
  if (!vpa) throw new Error('UPI VPA is required');

  const parts = [
    `pa=${encodeVpa(vpa)}`,
    `pn=${encodeURIComponent(params.payeeName?.trim() || 'Payee')}`,
    `am=${encodeURIComponent(formatUpiAmount(params.amount))}`,
    `cu=${encodeURIComponent(params.currency ?? 'INR')}`,
  ];
  const note = params.note?.trim();
  if (note) parts.push(`tn=${encodeURIComponent(note)}`);

  return `upi://pay?${parts.join('&')}`;
}
