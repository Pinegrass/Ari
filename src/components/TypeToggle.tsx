import React from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { color, font } from '../theme/tokens';

interface Props {
  value: 'expense' | 'income';
  onChange: (v: 'expense' | 'income') => void;
}

export default function TypeToggle({ value, onChange }: Props) {
  const { phrase } = useLanguage();
  return (
    <View style={styles.container}>
      <TouchableOpacity
        accessibilityRole="radio" accessibilityState={{ selected: value === 'expense' }} accessibilityLabel={phrase('Expense')} onPress={() => onChange('expense')}
        style={[styles.btn, value === 'expense' && styles.expenseActive]}
        activeOpacity={0.8}
      >
        <Text style={[styles.text, value === 'expense' && styles.activeText]}>
          💸 {phrase('Expense')}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        accessibilityRole="radio" accessibilityState={{ selected: value === 'income' }} accessibilityLabel={phrase('Income')} onPress={() => onChange('income')}
        style={[styles.btn, value === 'income' && styles.incomeActive]}
        activeOpacity={0.8}
      >
        <Text style={[styles.text, value === 'income' && styles.incomeText]}>
          💰 {phrase('Income')}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: color.cream2,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: color.line,
    marginBottom: 20,
  },
  btn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  expenseActive: {
    backgroundColor: color.clay,
  },
  incomeActive: {
    backgroundColor: color.forest,
  },
  text: {
    fontSize: 14,
    fontFamily: font.bodySemi,
    color: color.inkSoft,
  },
  activeText: {
    color: color.cream,
  },
  incomeText: {
    color: color.cream,
  },
});
