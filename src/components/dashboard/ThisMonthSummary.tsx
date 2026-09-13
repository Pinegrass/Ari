import {useLanguage as useCopyLanguage} from '../../i18n/LanguageContext';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { color, font, type as ftype } from '../../theme/tokens';
import { usePrivacy } from '../../context/PrivacyContext';
import { useLocale } from '../../hooks/useLocale';
import { formatCurrencyFull } from '../../utils/locale';

interface Props {
  income: number;
  expenses: number;
}

export default function ThisMonthSummary({ income, expenses }: Props) {
 const {phrase:localizeCopy, t}=useCopyLanguage();
  const { isPrivate } = usePrivacy();
  const { locale, formatCurrency } = useLocale();
  const formatAmount = (value: number) => isPrivate ? '••••' : formatCurrency(value);
  const savings = income - expenses;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{localizeCopy("This month")}</Text>
      <View style={styles.row}>
        <View style={styles.cell}>
          <Text style={styles.label}>{localizeCopy("Income")}</Text>
          <Text style={[styles.amount, styles.income]}>{formatAmount(income)}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.cell}>
          <Text style={styles.label}>{localizeCopy("Spent")}</Text>
          <Text style={[styles.amount, styles.expense]}>{formatAmount(expenses)}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.cell}>
          <Text style={styles.label}>{t('homeRecordedNet')}</Text>
          <Text style={[styles.amount, isPrivate ? undefined : savings >= 0 ? styles.saved : styles.expense]}>
            {isPrivate ? '••••' : formatCurrencyFull(savings, locale)}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: color.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: color.line,
    padding: 18,
    marginBottom: 16,
  },
  title: {
    fontFamily: font.displaySemi,
    fontSize: ftype.sectionHead,
    color: color.forestDeep,
    marginBottom: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cell: {
    flex: 1,
    alignItems: 'center',
  },
  divider: {
    width: 1,
    height: 36,
    backgroundColor: color.line,
  },
  label: {
    fontFamily: font.bodySemi,
    fontSize: 10,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: color.inkFaint,
    marginBottom: 6,
  },
  amount: {
    fontFamily: font.displaySemi,
    fontSize: 16,
    color: color.ink,
  },
  income: { color: color.forest2 },
  expense: { color: color.clay },
  saved: { color: color.forest },
  rate: {
    fontFamily: font.bodyMed,
    fontSize: 10,
    color: color.inkFaint,
    marginTop: 4,
  },
});
