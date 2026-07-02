import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { color, font, type as ftype } from '../../theme/tokens';
import { CATEGORY_ICONS } from '../ui/Icon';
import { usePrivacy } from '../../context/PrivacyContext';

interface Props {
  categories: Record<string, number>;
}

export default function CategoryComparison({ categories }: Props) {
  const { formatAmount } = usePrivacy();

  const entries = useMemo(() => {
    return Object.entries(categories)
      .filter(([, amount]) => amount > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [categories]);

  const total = useMemo(() => entries.reduce((sum, [, amount]) => sum + amount, 0), [entries]);

  if (entries.length === 0) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>Top categories</Text>
        <Text style={styles.empty}>No spending data yet.</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Top categories</Text>
      {entries.map(([name, amount]) => {
        const pct = total > 0 ? Math.round((amount / total) * 100) : 0;
        const meta = CATEGORY_ICONS[name] || { color: color.inkFaint };
        return (
          <View key={name} style={styles.row}>
            <View style={[styles.dot, { backgroundColor: meta.color }]} />
            <Text style={styles.name} numberOfLines={1}>
              {name.charAt(0).toUpperCase() + name.slice(1)}
            </Text>
            <View style={styles.barWrap}>
              <View style={[styles.bar, { width: `${pct}%`, backgroundColor: meta.color }]} />
            </View>
            <Text style={styles.amount}>{formatAmount(amount)}</Text>
          </View>
        );
      })}
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
  empty: {
    fontFamily: font.body,
    fontSize: 13,
    color: color.inkSoft,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  name: {
    width: 80,
    fontFamily: font.bodyMed,
    fontSize: 12,
    color: color.ink,
  },
  barWrap: {
    flex: 1,
    height: 8,
    backgroundColor: color.line,
    borderRadius: 4,
    overflow: 'hidden',
  },
  bar: {
    height: 8,
    borderRadius: 4,
  },
  amount: {
    width: 70,
    fontFamily: font.bodySemi,
    fontSize: 12,
    color: color.ink,
    textAlign: 'right',
  },
});
