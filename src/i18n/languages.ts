export const languages = {
  en: { name: 'English', locale: 'en' },
  hi: { name: 'हिन्दी', locale: 'hi-IN' },
  es: { name: 'Español', locale: 'es' },
  fr: { name: 'Français', locale: 'fr' },
  'pt-BR': { name: 'Português (Brasil)', locale: 'pt-BR' },
  ar: { name: 'العربية', locale: 'ar' },
} as const;

export type Language = keyof typeof languages;

export function isLanguage(value: string | null): value is Language {
  return value !== null && Object.prototype.hasOwnProperty.call(languages, value);
}

export function displayLocale(language: Language, englishLocale = 'en'): string {
  return language === 'en' ? englishLocale : languages[language].locale;
}

export function preferredLanguage(localeTag: string): Language {
  const tag = localeTag.toLowerCase();
  if (tag === 'pt-br') return 'pt-BR';
  const languageCode = tag.split('-')[0];
  return isLanguage(languageCode) ? languageCode : 'en';
}

/** Older notification APIs accept only the original two message catalogs. */
export function notificationLanguage(language: Language): 'en' | 'hi' {
  return language === 'hi' ? 'hi' : 'en';
}
