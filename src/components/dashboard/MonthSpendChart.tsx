import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { color, font, type as ftype } from '../../theme/tokens';
import type { DailyAnalytics } from '../../api/reports';

interface Props {
  data: DailyAnalytics | null;
  loading?: boolean;
}

export default function MonthSpendChart({ data, loading }: Props) {
  const chartData = useMemo(() => {
    if (!data) return [];
    return Object.entries(data.days)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, amount]) => {
        const day = Number(date.split('-')[2]);
        return {
          value: amount,
          label: day % 5 === 0 || day === 1 ? String(day) : '',
          frontColor: amount > 0 ? color.clay : color.line,
        };
      });
  }, [data]);

  if (loading) {
    return (
      <View style={[styles.card, styles.center]}>
        <ActivityIndicator color={color.forest} />
      </View>
    );
  }

  if (!data || chartData.length === 0) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>Daily spending</Text>
        <Text style={styles.empty}>No spending this month yet.</Text>
      </View>
    );
  }

  const maxValue = Math.max(data.max, 1);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Daily spending</Text>
      <BarChart
        data={chartData}
        height={140}
        maxValue={maxValue}
        noOfSections={4}
        barWidth={6}
        spacing={4}
        barBorderRadius={3}
        hideRules
        hideYAxisText
        xAxisColor={color.line}
        yAxisColor="transparent"
        yAxisThickness={0}
        xAxisThickness={1}
        xAxisLabelTextStyle={styles.labelText}
        showLine={false}
        isAnimated
      />
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Total <Text style={styles.footerBold}>₹{data.total.toLocaleString('en-IN')}</Text>
        </Text>
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
  footer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: color.line,
  },
  footerText: {
    fontFamily: font.body,
    fontSize: 12,
    color: color.inkSoft,
  },
  footerBold: {
    fontFamily: font.bodySemi,
    color: color.ink,
  },
});
