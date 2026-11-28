import React from 'react';
import { Text, View } from 'react-native';
import ScreenShell from '../../components/ScreenShell';
import { useLanguage } from '../../i18n/LanguageContext';

export default function TaxUnavailableScreen() {
  const { phrase } = useLanguage();
  return <ScreenShell edges={['top']}><View style={{ padding: 24 }}>
    <Text accessibilityRole="header" style={{ fontSize: 22, fontWeight: '700' }}>{phrase('Tax estimator unavailable')}</Text>
    <Text style={{ marginTop: 12 }}>{phrase('We are reviewing the tax rules for each supported year and region. Saved tax profiles remain available when the estimator returns.')}</Text>
  </View></ScreenShell>;
}
