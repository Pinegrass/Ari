import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';

import Icon from '../ui/Icon';
import { useLocale } from '../../hooks/useLocale';
import { color, font, type as typeScale } from '../../theme/tokens';
import { getBills } from '../../lib/bills';
import { selectUpcomingCharges, type UpcomingCharge } from '../../lib/upcomingCharges';
import { useData } from '../../context/DataContext';
import type { TabParamList, MainStackParamList } from '../../navigation/navigationTypes';

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Dashboard'>,
  StackNavigationProp<MainStackParamList>
>;

function dueLabel(daysUntil: number): string {
  if (daysUntil <= 0) return 'Due today';
  if (daysUntil === 1) return 'Due tomorrow';
  return `Due in ${daysUntil} days`;
}

/**
 * "Upcoming charges" — the next ~30 days of money going out, merging scheduled
 * bills/EMIs with projections from recurring transactions (D2). Tap a row to log
 * it via fast entry (prefilled). Renders nothing when there's nothing due soon,
 * so Home stays clean for users with neither.
 */
export default function UpcomingBillsCard() {
  const { formatCurrency } = useLocale();
  const navigation = useNavigation<Nav>();
  const { transactions } = useData();
  const [charges, setCharges] = useState<UpcomingCharge[] | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getBills().then((all) => {
        if (active) setCharges(selectUpcomingCharges(all, transactions, new Date(), 30));
      });
      return () => {
        active = false;
      };
    }, [transactions])
  );

  if (!charges || charges.length === 0) return null;

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <Text style={styles.title}>Upcoming charges</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('Bills')}
          accessibilityRole="link"
          accessibilityLabel="Manage bills"
        >
          <Text style={styles.manage}>Manage</Text>
        </TouchableOpacity>
      </View>

      {charges.slice(0, 4).map((charge) => (
        <TouchableOpacity
          key={charge.key}
          style={styles.row}
          activeOpacity={0.85}
          onPress={() =>
            navigation.navigate('AddTransaction', {
              type: 'expense',
              prefill: { amount: charge.amount, description: charge.name, category: charge.category },
            })
          }
          accessibilityLabel={`Log ${charge.name}`}
        >
          <View style={[styles.dot, charge.daysUntil <= 1 && styles.dotSoon]} />
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{charge.name}</Text>
            <Text style={styles.meta}>
              {dueLabel(charge.daysUntil)}
              {charge.source === 'recurring' ? ' · recurring' : ''}
            </Text>
          </View>
          <Text style={styles.amount}>{formatCurrency(charge.amount)}</Text>
          <Icon name="chevron-right" size={16} color={color.inkFaint} />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: color.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: color.line,
    padding: 16,
    marginTop: 18,
  },
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  title: { fontFamily: font.displaySemi, fontSize: typeScale.sectionHead, color: color.forestDeep },
  manage: { fontFamily: font.bodySemi, fontSize: 12.5, color: color.moss },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 9,
    borderTopWidth: 1,
    borderTopColor: color.line,
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: color.moss },
  dotSoon: { backgroundColor: color.clay },
  name: { fontFamily: font.bodySemi, fontSize: 14, color: color.ink },
  meta: { fontFamily: font.body, fontSize: typeScale.caption, color: color.inkSoft, marginTop: 1 },
  amount: { fontFamily: font.bodySemi, fontSize: 14, color: color.ink },
});
