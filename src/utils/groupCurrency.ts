import {groupCopy} from '../i18n/groupFlowCopy';

/** Recorded group units never follow the viewer's changing profile currency. */
export function formatGroupAmount(amount: number, currency: string | null, language: string, isPrivate = false) {
  if (isPrivate) return '••••';
  const number = Math.abs(amount);
  if (!currency) return `${number.toFixed(2)} (${groupCopy(language, 'Recorded currency unknown')})`;
  return new Intl.NumberFormat(language === 'hi' ? 'hi-IN' : 'en', {
    style: 'currency', currency, currencyDisplay: 'code', minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(number);
}
