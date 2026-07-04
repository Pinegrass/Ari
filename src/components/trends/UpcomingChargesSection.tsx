import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { color, font, type as typeScale } from '../../theme/tokens';
import { getBills } from '../../lib/bills';
import { selectUpcomingCharges, type UpcomingCharge } from '../../lib/upcomingCharges';
import { useData } from '../../context/DataContext';

function dueLabel(daysUntil: number): string {
  if (daysUntil <= 0) return 'today';
  if (daysUntil === 1) return 'tomorrow';
  return `in ${daysUntil} days`;
}

/**
 * The full next-30-days view of upcoming charges for the Trends screen (D2) —
 * bills + recurring projections, with a projected total. The Dashboard card
 * shows the soonest 4; this shows everything so the user can see the month's
 * committed outflow at a glance.
 */
export default function UpcomingChargesSection() {
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
    }, [transactions]),
  );

  if (!charges || charges.length === 0) return null;

  const total = charges.reduce((sum, c) => sum + c.amount, 0);

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <Text style={styles.title}>Upcoming charges</Text>
        <Text style={styles.total}>₹{total.toLocaleString('en-IN')} · 30 days</Text>
      </View>

      {charges.map((charge) => (
        <View key={charge.key} style={styles.row}>
          <View style={[styles.dot, charge.daysUntil <= 1 && styles.dotSoon]} />
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{charge.name}</Text>
            <Text style={styles.meta}>
              Due {dueLabel(charge.daysUntil)}
              {charge.source === 'recurring' ? ' · recurring' : ' · bill'}
            </Text>
          </View>
          <Text style={styles.amount}>₹{charge.amount.toLocaleString('en-IN')}</Text>
        </View>
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
    marginTop: 16,
  },
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  title: { fontFamily: font.displaySemi, fontSize: typeScale.sectionHead, color: color.forestDeep },
  total: { fontFamily: font.bodySemi, fontSize: 12.5, color: color.moss },
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
