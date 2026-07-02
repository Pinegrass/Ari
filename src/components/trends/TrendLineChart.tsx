import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { color, font, type as ftype } from '../../theme/tokens';
import type { PnlReport } from '../../types';

interface Props {
  report: PnlReport | null;
  loading?: boolean;
}

const MONTH_SHORT: Record<string, string> = {
  '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr',
  '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Aug',
  '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dec',
};

export default function TrendLineChart({ report, loading }: Props) {
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
    }));
  }, [report]);

  if (loading) {
    return (
      <View style={[styles.card, styles.center]}>
        <ActivityIndicator color={color.forest} />
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
      <LineChart
        data={incomeData}
        data2={expenseData}
        height={160}
        spacing={report.months.length > 6 ? 30 : 50}
        color={color.forest2}
        color2={color.clay}
        thickness={2}
        thickness2={2}
        hideDataPoints={false}
        dataPointsColor={color.forest2}
        dataPointsColor2={color.clay}
        hideRules
        hideYAxisText
        xAxisColor={color.line}
        yAxisColor="transparent"
        yAxisThickness={0}
        xAxisThickness={1}
        xAxisLabelTextStyle={styles.labelText}
        showVerticalLines
        verticalLinesColor={color.line}
        isAnimated
      />
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: color.forest2 }]} />
          <Text style={styles.legendText}>Income</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: color.clay }]} />
          <Text style={styles.legendText}>Expenses</Text>
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
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 160,
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
  labelText: {
    fontFamily: font.bodyMed,
    fontSize: 9,
    color: color.inkFaint,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: color.line,
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
    color: color.inkSoft,
  },
});
