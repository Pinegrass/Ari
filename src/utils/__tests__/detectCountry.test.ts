import { getLocales } from 'expo-localization';
import { detectCountryFromDevice } from '../detectCountry';

jest.mock('expo-localization', () => ({ getLocales: jest.fn() }));

it.each([['GB', 'GB'], ['AU', 'AU'], ['FR', null], ['BR', null], [null, null]])(
  'only preselects a supported region for %s',
  (regionCode, expected) => {
    jest.mocked(getLocales).mockReturnValue([{ regionCode }] as unknown as ReturnType<typeof getLocales>);
    expect(detectCountryFromDevice()).toBe(expected);
  },
);
