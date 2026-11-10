import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager, Platform } from 'react-native';
import { reloadAppAsync } from 'expo';
import { getLocales } from 'expo-localization';
import { MessageKey, translate } from './catalog';
import { isLanguage, preferredLanguage, type Language } from './languages';
import { phrase } from './phrases';

const KEY = 'ari_language';
const LanguageContext = createContext({ language: 'en' as Language, setLanguage: async (_language: Language) => {} });

async function syncDirection(language: Language) {
  if (Platform.OS !== 'android' && Platform.OS !== 'ios') return;
  const rtl = language === 'ar';
  if (I18nManager.isRTL === rtl) return;
  I18nManager.allowRTL(rtl);
  I18nManager.forceRTL(rtl);
  await reloadAppAsync();
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setValue] = useState<Language>('en');
  const changed = useRef(false);
  useEffect(() => {
    void AsyncStorage.getItem(KEY).then(async value => {
      if (changed.current) return;
      const saved = isLanguage(value) ? value : preferredLanguage(getLocales()[0]?.languageTag ?? 'en');
      setValue(saved);
      await syncDirection(saved);
    }).catch(() => {});
  }, []);
  const setLanguage = useCallback(async (value: Language) => {
    changed.current = true;
    await AsyncStorage.setItem(KEY, value);
    setValue(value);
    await syncDirection(value);
  }, []);
  const value = useMemo(() => ({ language, setLanguage }), [language, setLanguage]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  const localize = useCallback((text: string) => phrase(context.language, text), [context.language]);
  const t = useCallback((key: MessageKey, values?: Record<string, string | number>) => translate(context.language, key, values), [context.language]);
  return { ...context, phrase: localize, t };
}
