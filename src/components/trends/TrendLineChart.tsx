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

  if (loading) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>Income vs Expenses</Text>
        <Skeleton width="100%" height={160} radius={12} style={{ marginTop: 12 }} />
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

  const barCount = incomeData.length;
  const gap = 4;
  const barW = Math.max(4, (CHART_WIDTH - gap * (barCount - 1)) / barCount / 2 - 2);
  const h = (v: number) => Math.max(0, (v / maxValue) * 140);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Income vs Expenses</Text>

      {/* Chart area */}
      <View style={styles.chartArea}>
        {/* Y-axis guide lines */}
        <View style={[styles.guide, { bottom: 0 }]} />
        <View style={[styles.guide, { bottom: 35 }]} />
        <View style={[styles.guide, { bottom: 70 }]} />
        <View style={[styles.guide, { bottom: 105 }]} />

        {/* Bars */}
        <View style={styles.barsRow}>
          {incomeData.map((d, i) => {
            const ev = expenseData[i]?.value ?? 0;
            return (
              <View key={d.label ?? i} style={styles.barCol}>
                {/* Income bar (green) */}
                <View style={[styles.bar, { height: h(d.value ?? 0), backgroundColor: c.forest2, width: barW }]} />
                {/* Expense bar (clay) */}
                <View style={[styles.bar, { height: h(ev), backgroundColor: c.clay, width: barW, marginLeft: 2 }]} />
                {/* Label */}
                <Text style={styles.barLabel} numberOfLines={1}>{d.label}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: c.forest2 }]} />
          <Text style={styles.legendText}>Income</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: c.clay }]} />
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
    height: 140,
    width: CHART_WIDTH,
    justifyContent: 'flex-end',
  },
  guide: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: c.line,
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    flex: 1,
  },
  barCol: {
    alignItems: 'center',
    flex: 1,
  },
  bar: {
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
    minHeight: 1,
  },
  barLabel: {
    fontFamily: font.bodyMed,
    fontSize: 8,
    color: c.inkFaint,
    marginTop: 4,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: c.line,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontFamily: font.bodyMed,
    fontSize: 12,
    color: c.inkSoft,
  },
});
