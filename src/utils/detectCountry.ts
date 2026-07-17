/**
 * Detects the user's default country from device locale at first launch.
 *
 * Used in the onboarding flow and register screen to pre-select the most
 * likely country, reducing friction.
 *
 * Maps common BCP-47 locale tags → ISO 3166-1 alpha-2 country codes.
 * Falls back to "IN" (the app's origin market) if unrecognised.
 */

import { Platform, NativeModules } from 'react-native';
import { SUPPORTED_COUNTRIES } from './locale';

// BCP-47 locale tag → ISO country code for our supported markets.
// Many locales don't imply a unique country (e.g. "en" could be US, GB, AU...)
// so we pick the most populous / likely Ari user for ambiguous tags.
const LOCALE_TO_COUNTRY: Record<string, string> = {
  'en-IN': 'IN', 'hi-IN': 'IN', 'bn-IN': 'IN', 'te-IN': 'IN', 'ta-IN': 'IN',
  'mr-IN': 'IN', 'gu-IN': 'IN', 'kn-IN': 'IN', 'ml-IN': 'IN',
  'en-US': 'US', 'es-US': 'US',
  'en-GB': 'GB',
  'en-AU': 'AU',
  'en-CA': 'US',   // Canada: closest match in our supported set is US
  'en-NZ': 'AU',    // New Zealand: closest match is AU
  'en-SG': 'GB',    // Singapore: closest match is GB (English, Western)
  'en-AE': 'GB',    // UAE: closest match is GB
  'en-ZA': 'GB',    // South Africa: closest match is GB
  'de-DE': 'GB',    // Germany: closest match is GB (EU, Western)
  'fr-FR': 'GB',    // France: closest match is GB
  'nl-NL': 'GB',    // Netherlands: closest match is GB
  'es-ES': 'GB',    // Spain: closest match is GB
  'it-IT': 'GB',    // Italy: closest match is GB
};

/**
 * Guess the user's country from device locale. Returns null if unrecognised
 * (caller should fall back to their own default, likely "IN").
 */
export function detectCountryFromDevice(): string | null {
  try {
    // React Native gives us the device locale via NativeModules
    let localeTag = '';

    if (Platform.OS === 'ios') {
      const settings = NativeModules.SettingsManager?.settings;
      localeTag =
        settings?.AppleLocale ??
        settings?.AppleLanguages?.[0] ??
        NativeModules.SettingsManager?.getConstants?.()?.AppleLocale ??
        '';
    } else {
      localeTag =
        NativeModules.I18nManager?.localeIdentifier ??
        NativeModules.PlatformConstants?.DeviceCountry ??
        '';
    }

    if (!localeTag) return null;

    // Normalise: "en_IN" → "en-IN", "en-us" → "en-US"
    const normalised = localeTag.replace(/_/g, '-');

    // Exact match first
    if (LOCALE_TO_COUNTRY[normalised]) {
      const code = LOCALE_TO_COUNTRY[normalised];
      return SUPPORTED_COUNTRIES.includes(code) ? code : null;
    }

    // Try just the language part (e.g. "en" from "en-XX")
    const lang = normalised.split('-')[0];
    const langMatch = Object.keys(LOCALE_TO_COUNTRY).find(
      (k) => k.startsWith(lang + '-')
    );
    if (langMatch) {
      const code = LOCALE_TO_COUNTRY[langMatch];
      return SUPPORTED_COUNTRIES.includes(code) ? code : null;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Get the best default country code for a new user.
 * Tries device locale first, falls back to "IN" (home market).
 */
export function getDefaultCountry(): string {
  return detectCountryFromDevice() ?? 'IN';
}
