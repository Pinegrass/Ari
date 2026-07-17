import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { font, type as ftype } from '../../theme/tokens';
import { useColors } from '../../context/ThemeContext';
import type { Palette } from '../../theme/palettes';
import { Skeleton } from '../ui/Skeleton';
import type { PnlReport } from '../../types';

interface Props {
  report: PnlReport | null;
  loading?: boolean;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_PAD = 18;
const CHART_WIDTH = SCREEN_WIDTH - 40 - CARD_PAD * 2;
const CHART_HEIGHT = 140;

const MONTH_SHORT: Record<string, string> = {
  '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr',
  '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Aug',
  '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dec',
};

export default function TrendLineChart({ report, loading }: Props) {
  const c = useColors();
  const styles = useMemo(() => makeStyles(c), [c]);

  const incomeData = useMemo(() => {
    if (!report) return [];
    return report.months.map((m) => ({
      value: m.income,
      label: MONTH_SHORT[m.month.split('-')[1]] ?? m.month,
    }));
  }, [report]);

  const expenseData = useMemo(() => {
    if (!report) return [];
    return report.months.map((m) => ({
      value: m.expenses,
      label: MONTH_SHORT[m.month.split('-')[1]] ?? m.month,
    }));
  }, [report]);

  const maxValue = useMemo(() => {
    const maxIncome = incomeData.length > 0 ? Math.max(...incomeData.map(d => d.value)) : 0;
    const maxExpense = expenseData.length > 0 ? Math.max(...expenseData.map(d => d.value)) : 0;
    return Math.max(maxIncome, maxExpense, 1);
  }, [incomeData, expenseData]);

  const barH = (v: number) => Math.max(0, (v / maxValue) * CHART_HEIGHT);

  if (loading) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>Income vs Expenses</Text>
        <Skeleton width="100%" height={CHART_HEIGHT} radius={12} style={{ marginTop: 12 }} />
      </View>
    );
  }

  if (!report || report.months.length === 0) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>Income vs Expenses</Text>
        <Text style={styles.empty}>Add transactions to see trends.</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Income vs Expenses</Text>

      <View style={styles.chartArea}>
        {/* Guide lines */}
        <View style={[styles.guide, { bottom: CHART_HEIGHT * 0.75 }]} />
        <View style={[styles.guide, { bottom: CHART_HEIGHT * 0.5 }]} />
        <View style={[styles.guide, { bottom: CHART_HEIGHT * 0.25 }]} />
        <View style={[styles.guide, { bottom: 0, backgroundColor: c.lineStrong }]} />

        {/* Bars */}
        <View style={styles.barsRow}>
          {incomeData.map((d, i) => {
            const ev = expenseData[i]?.value ?? 0;
            const ih = barH(d.value ?? 0);
            const eh = barH(ev);
            return (
              <View key={d.label ?? i} style={styles.barCol}>
                <View style={styles.barPair}>
                  <View style={[styles.barIncome, { height: ih }]} />
                  <View style={[styles.barExpense, { height: eh }]} />
                </View>
                <Text style={styles.barLabel} numberOfLines={1}>{d.label}</Text>
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: c.forest2 }]} />
          <Text style={styles.legendText}>Income</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: c.clay }]} />
          <Text style={styles.legendText}>Expenses</Text>
        </View>
      </View>
    </View>
  );
}

const makeStyles = (c: Palette) => StyleSheet.create({
  card: {
    backgroundColor: c.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: c.line,
    padding: CARD_PAD,
    marginBottom: 16,
  },
  title: {
    fontFamily: font.displaySemi,
    fontSize: ftype.sectionHead,
    color: c.forestDeep,
    marginBottom: 14,
  },
  empty: {
    fontFamily: font.body,
    fontSize: 13,
    color: c.inkSoft,
  },
  chartArea: {
    height: CHART_HEIGHT,
    width: CHART_WIDTH,
    justifyContent: 'flex-end',
  },
  guide: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: c.line,
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    flex: 1,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  barPair: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
  },
  barIncome: {
    width: 8,
    backgroundColor: c.forest2,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    minHeight: 2,
  },
  barExpense: {
    width: 8,
    backgroundColor: c.clay,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    minHeight: 2,
  },
  barLabel: {
    fontFamily: font.bodyMed,
    fontSize: 9,
    color: c.inkFaint,
    marginTop: 6,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: c.line,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 3,
  },
  legendText: {
    fontFamily: font.bodyMed,
    fontSize: 13,
    color: c.inkSoft,
  },
});
