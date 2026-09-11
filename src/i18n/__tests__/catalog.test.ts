import { catalogs, entryCount, translate } from '../catalog';
describe('Hindi catalog', () => {
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
