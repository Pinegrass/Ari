import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Language, MessageKey, translate } from './catalog';
import { phrase } from './phrases';

const KEY = 'ari_language';
const LanguageContext = createContext({ language: 'en' as Language, setLanguage: async (_language: Language) => {} });

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setValue] = useState<Language>('en');
  const changed = useRef(false);
  useEffect(() => { void AsyncStorage.getItem(KEY).then(value => {
    if (!changed.current && (value === 'en' || value === 'hi')) setValue(value);
  }).catch(() => {}); }, []);
  const setLanguage = useCallback(async (value: Language) => {
    changed.current = true;
    await AsyncStorage.setItem(KEY, value);
    setValue(value);
  }, []);
  const value = useMemo(() => ({ language, setLanguage }), [language, setLanguage]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  return { ...context, phrase: (text: string) => phrase(context.language, text), t: (key: MessageKey, values?: Record<string, string | number>) => translate(context.language, key, values) };
}
