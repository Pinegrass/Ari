import { catalogs, entryCount, translate } from '../catalog';
import type { MessageKey } from '../catalog';
describe('Hindi catalog', () => {
  it('renders every bottom-tab key in both languages', () => {
    for (const language of ['en', 'hi'] as const) {
      for (const key of ['home', 'accountant', 'tomo', 'more'] as const) {
        expect(translate(language, key)).toBeTruthy();
      }
    }
    expect(translate('en', 'more')).toBe('More');
  });
  it('keeps an unexpected runtime key from crashing navigation', () => {
    expect(translate('en', 'unregistered' as MessageKey)).toBe('unregistered');
  });
  it('preserves every message and interpolation variable', () => {
    expect(Object.keys(catalogs.hi).sort()).toEqual(Object.keys(catalogs.en).sort());
    for (const key of Object.keys(catalogs.en) as (keyof typeof catalogs.en)[]) {
      expect(catalogs.hi[key].match(/\{\w+\}/g) ?? []).toEqual(catalogs.en[key].match(/\{\w+\}/g) ?? []);
    }
    expect(translate('hi','comparison',{start:'1',end:'2'})).toBe('1 – 2 से तुलना');
    expect(entryCount('en',1)).toBe('1 entry'); expect(entryCount('en',2)).toBe('2 entries');
    expect(entryCount('hi',2)).toBe('2 एंट्री');
  });
});
