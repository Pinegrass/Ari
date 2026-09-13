import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { color, onForest, font } from '../theme/tokens';
import { usePrivacy } from '../context/PrivacyContext';
import { useLocale } from '../hooks/useLocale';
import { useLanguage } from '../i18n/LanguageContext';

interface Props {
  spentToday: number;
  spentThisMonth: number | null;
  loading?: boolean;
  onPlan: () => void;
}

/** One daily figure, monthly context and a route to user-confirmed planning. */
export default function BalanceCard({ spentToday, spentThisMonth, loading, onPlan }: Props) {
  const { isPrivate } = usePrivacy();
  const { formatCurrency } = useLocale();
  const { t } = useLanguage();
  const amount = (value: number) => isPrivate ? '••••' : formatCurrency(value);
  const today = loading ? t('homeLoading') : amount(spentToday);
  return (
    <View style={styles.hero}>
      <View accessible accessibilityRole="summary" accessibilityLabel={`${t('homeSpentToday')}, ${today}`}>
        <Text style={styles.label}>{t('homeSpentToday')}</Text>
        <Text style={[styles.amount, loading && styles.loading]} numberOfLines={1} adjustsFontSizeToFit>{today}</Text>
      </View>
      <View style={styles.month}>
        <Text style={styles.monthLabel}>{t('homeSpentMonth')}</Text>
        <Text style={styles.monthAmount}>{spentThisMonth === null ? '—' : amount(spentThisMonth)}</Text>
      </View>
      <TouchableOpacity onPress={onPlan} style={styles.plan} accessibilityRole="button">
        <Text style={styles.planText}>{t('planning')} →</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { marginTop: 20, marginBottom: 10, backgroundColor: color.forest, borderRadius: 24, padding: 22 },
  label: { fontFamily: font.bodySemi, fontSize: 14, color: onForest.label },
  amount: { fontFamily: font.display, fontSize: 48, marginTop: 8, color: onForest.textBright },
  loading: { fontFamily: font.body, fontSize: 18 },
  month: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'baseline', marginTop: 12 },
  monthLabel: { fontFamily: font.body, fontSize: 13, color: onForest.label },
  monthAmount: { fontFamily: font.bodySemi, fontSize: 15, color: onForest.text },
  plan: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.18)', marginTop: 16, paddingTop: 12, minHeight: 44, justifyContent: 'center' },
  planText: { fontFamily: font.bodySemi, fontSize: 14, color: onForest.textBright },
});
