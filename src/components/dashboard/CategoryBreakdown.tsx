import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import { color, font, type as ftype } from '../../theme/tokens';
import { CATEGORY_ICONS } from '../ui/Icon';
import { usePrivacy } from '../../context/PrivacyContext';

interface Props {
  categories: Record<string, number>;
}

export default function CategoryBreakdown({ categories }: Props) {
  const { formatAmount } = usePrivacy();

  const pieData = useMemo(() => {
    const entries = Object.entries(categories)
      .filter(([, amount]) => amount > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
    return entries.map(([name, amount]) => {
      const meta = CATEGORY_ICONS[name] || { color: color.inkFaint };
      return {
        value: amount,
        color: meta.color,
        text: name,
      };
    });
  }, [categories]);

  const total = useMemo(
    () => pieData.reduce((sum, item) => sum + item.value, 0),
    [pieData]
  );

  if (pieData.length === 0) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>Spending by category</Text>
        <Text style={styles.empty}>Add expenses to see the breakdown.</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Spending by category</Text>
      <View style={styles.chartRow}>
        <PieChart
          data={pieData}
          donut
          radius={70}
          innerRadius={42}
          innerCircleColor={color.card}
          centerLabelComponent={() => (
            <View style={styles.centerLabel}>
              <Text style={styles.centerTotal}>{formatAmount(total)}</Text>
            </View>
          )}
          focusOnPress
          showText={false}
        />
        <View style={styles.legend}>
          {pieData.map((item) => (
            <View key={item.text} style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: item.color }]} />
              <Text style={styles.legendName} numberOfLines={1}>
                {item.text.charAt(0).toUpperCase() + item.text.slice(1)}
              </Text>
              <Text style={styles.legendAmount}>{formatAmount(item.value)}</Text>
            </View>
          ))}
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
  empty: {
    fontFamily: font.body,
    fontSize: 13,
    color: color.inkSoft,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  centerLabel: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerTotal: {
    fontFamily: font.displaySemi,
    fontSize: 14,
    color: color.ink,
  },
  legend: {
    flex: 1,
    marginLeft: 16,
    gap: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendName: {
    flex: 1,
    fontFamily: font.bodyMed,
    fontSize: 12,
    color: color.ink,
  },
  legendAmount: {
    fontFamily: font.bodySemi,
    fontSize: 12,
    color: color.inkSoft,
  },
});
