import React from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import { useLanguage } from '../i18n/LanguageContext';
import { languages, type Language } from '../i18n/languages';
import { track } from '../lib/analytics';

export default function LanguageControl({ compact = false }: { compact?: boolean }) {
  const { language, setLanguage, t } = useLanguage();
  return <View style={{ paddingVertical: compact ? 4 : 16, gap: 10 }}>
    {!compact && <Text>{t('language')}</Text>}
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
      {(Object.keys(languages) as Language[]).map(value => <TouchableOpacity key={value} accessibilityRole="button" accessibilityState={{ selected: language === value }} style={{ padding: 12, borderWidth: language === value ? 2 : 1, borderRadius: 12 }} onPress={() => {
        void setLanguage(value).then(() => track('language_changed', { language: value })).catch(() => Alert.alert(t('error')));
      }}><Text accessibilityLanguage={languages[value].locale}>{languages[value].name}</Text></TouchableOpacity>)}
    </View>
    {!compact && <Text>{t('localLanguage')}</Text>}
  </View>;
}
