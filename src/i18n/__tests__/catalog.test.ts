import { catalogs, entryCount, translate } from '../catalog';
import type { MessageKey } from '../catalog';
import { isLanguage, preferredLanguage } from '../languages';
import { phrase } from '../phrases';
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

describe('global release locales', () => {
  it('selects supported device languages without treating Portuguese variants as interchangeable', () => {
    expect(preferredLanguage('es-MX')).toBe('es');
    expect(preferredLanguage('ar-EG')).toBe('ar');
    expect(preferredLanguage('fr-CA')).toBe('fr');
    expect(preferredLanguage('pt-br')).toBe('pt-BR');
    expect(preferredLanguage('pt-PT')).toBe('en');
    expect(preferredLanguage('de-DE')).toBe('en');
  });

  it.each([
    ['es', 'Idioma', 'Añadir movimiento'],
    ['fr', 'Langue', 'Ajouter une transaction'],
    ['pt-BR', 'Idioma', 'Adicionar transação'],
    ['ar', 'اللغة', 'إضافة معاملة'],
  ] as const)('renders %s and keeps interpolation values', (language, label, addEntry) => {
    expect(isLanguage(language)).toBe(true);
    expect(translate(language, 'language')).toBe(label);
    expect(translate(language, 'addEntry')).toBe(addEntry);
    expect(translate(language, 'comparison', { start: '2026-11-01', end: '2026-11-10' }))
      .toEqual(expect.stringContaining('2026-11-10'));
    for (const value of Object.values(catalogs.en)) {
      expect((phrase(language, value).match(/\{\w+\}/g) ?? []).sort())
        .toEqual((value.match(/\{\w+\}/g) ?? []).sort());
    }
  });
});
