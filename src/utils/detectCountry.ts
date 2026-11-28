import { getLocales } from 'expo-localization';
import { SUPPORTED_COUNTRIES } from './locale';

/** Only preselect a country when the device reports a supported region. */
export function detectCountryFromDevice(): string | null {
  const region = getLocales()[0]?.regionCode?.toUpperCase();
  return region && SUPPORTED_COUNTRIES.includes(region) ? region : null;
}
