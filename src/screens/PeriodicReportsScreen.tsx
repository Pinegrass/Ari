import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { getPeriodicReport, type PeriodicReport, type ReportPeriod } from '../api/reports';
import ScreenShell from '../components/ScreenShell';
import Icon, { CATEGORY_ICONS } from '../components/ui/Icon';
import ProgressBar from '../components/ui/ProgressBar';
import AnimatedEntry from '../components/ui/AnimatedEntry';
import { useLocale } from '../hooks/useLocale';
import { useHaptics } from '../hooks/useHaptics';
import { color, font, onForest, type } from '../theme/tokens';
import { track } from '../lib/analytics';

const PERIODS: { key: ReportPeriod; label: string }[] = [
  { key: 'daily', label: 'Daily' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
];

export default function PeriodicReportsScreen() {
  const navigation = useNavigation();
  const haptics = useHaptics();
  const { formatCurrency } = useLocale();
  const [period, setPeriod] = useState<ReportPeriod>('weekly');
  const [report, setReport] = useState<PeriodicReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    try {
      const value = await getPeriodicReport(period);
      setReport(value);
      track('periodic_report_viewed', { period, has_data: value.totals.transactionCount > 0 });
    } catch {
      setReport(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [period]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const timeline = useMemo(() => {
    if (!report) return [];
    if (report.timeline.length <= 14) return report.timeline;
    const buckets: PeriodicReport['timeline'] = [];
    for (let i = 0; i < report.timeline.length; i += 3) {
      const group = report.timeline.slice(i, i + 3);
      buckets.push({
        date: group[0].date,
        label: String(new Date(`${group[0].date}T00:00:00`).getDate()),
        income: group.reduce((sum, row) => sum + row.income, 0),
        expenses: group.reduce((sum, row) => sum + row.expenses, 0),
      });
    }
    return buckets;
  }, [report]);

  return (
    <ScreenShell edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back} accessibilityLabel="Go back">
          <Icon name="arrow-left" size={22} color={color.ink} />
        </TouchableOpacity>
        <View><Text style={styles.headerTitle}>Money reports</Text><Text style={styles.headerSub}>A clear rhythm, from today to the month</Text></View>
      </View>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={color.forest} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.segment}>
          {PERIODS.map((item) => (
            <TouchableOpacity
              key={item.key}
              style={[styles.segmentButton, period === item.key && styles.segmentActive]}
              onPress={() => { haptics.light(); setPeriod(item.key); }}
              accessibilityState={{ selected: period === item.key }}
            >
              <Text style={[styles.segmentText, period === item.key && styles.segmentTextActive]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <View style={styles.loading}><ActivityIndicator size="large" color={color.forest} /><Text style={styles.loadingText}>Building your report…</Text></View>
        ) : !report ? (
          <View style={styles.loading}><Text style={styles.emptyTitle}>Report unavailable</Text><Text style={styles.loadingText}>Pull down to try again.</Text></View>
        ) : (
          <>
            <AnimatedEntry delay={0}>
              <View style={styles.hero}>
                <View style={styles.heroTop}><Text style={styles.heroKicker}>{report.label}</Text><Comparison change={report.comparison.expensesChange} /></View>
                <Text style={styles.heroLabel}>Money left after spending</Text>
                <Text style={styles.heroAmount}>{formatCurrency(report.totals.net)}</Text>
                <View style={styles.heroMetrics}>
                  <Metric label="Income" value={formatCurrency(report.totals.income)} positive />
                  <Metric label="Spent" value={formatCurrency(report.totals.expenses)} />
                  <Metric label="Entries" value={String(report.totals.transactionCount)} positive />
                </View>
              </View>
            </AnimatedEntry>

            <AnimatedEntry delay={70}>
              <View style={styles.insightCard}>
                <Icon name="lightbulb" size={20} color={color.gold} />
                <Text style={styles.insightText}>{report.highlight}</Text>
              </View>
            </AnimatedEntry>

            <AnimatedEntry delay={120}>
              <View style={styles.card}>
                <View style={styles.cardHead}><Text style={styles.sectionTitle}>Spending rhythm</Text><Text style={styles.legend}>■ Spending</Text></View>
                <Timeline rows={timeline} />
              </View>
            </AnimatedEntry>

            <AnimatedEntry delay={170}>
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Where it went</Text>
                {report.categories.length === 0 ? <Text style={styles.muted}>No spending categories in this period.</Text> : report.categories.map((category) => {
                  const info = CATEGORY_ICONS[category.name];
                  return (
                    <View key={category.name} style={styles.categoryRow}>
                      <View style={[styles.categoryIcon, { backgroundColor: `${info?.color ?? color.moss}20` }]}>
                        <Icon name={info?.icon ?? 'package'} size={16} color={info?.color ?? color.moss} />
                      </View>
                      <View style={styles.categoryBody}>
                        <View style={styles.categoryHead}><Text style={styles.categoryName}>{category.name}</Text><Text style={styles.categoryAmount}>{formatCurrency(category.amount)} · {category.share}%</Text></View>
                        <ProgressBar percentage={category.share} color={info?.color ?? color.moss} height={6} />
                      </View>
                    </View>
                  );
                })}
              </View>
            </AnimatedEntry>

            {report.goals.length > 0 && (
              <AnimatedEntry delay={220}>
                <View style={styles.card}>
                  <Text style={styles.sectionTitle}>Goals in motion</Text>
                  {report.goals.map((goal) => (
                    <View key={goal.id} style={styles.goal}>
                      <View style={styles.categoryHead}><Text style={styles.goalName}>{goal.name}</Text><Text style={styles.goalPct}>{goal.progress}%</Text></View>
                      <ProgressBar percentage={goal.progress} height={8} />
                      <Text style={styles.goalAmount}>{formatCurrency(goal.current)} of {formatCurrency(goal.target)}</Text>
                    </View>
                  ))}
                </View>
              </AnimatedEntry>
            )}
          </>
        )}
      </ScrollView>
    </ScreenShell>
  );
}

function Comparison({ change }: { change: number | null }) {
  if (change === null) return <Text style={styles.compareNeutral}>First comparison</Text>;
  const better = change <= 0;
  return <Text style={[styles.compare, better ? styles.compareGood : styles.compareWarm]}>{change > 0 ? '+' : ''}{change}% spend</Text>;
}

function Metric({ label, value, positive = false }: { label: string; value: string; positive?: boolean }) {
  return <View style={styles.metric}><Text style={styles.metricLabel}>{label}</Text><Text style={[styles.metricValue, !positive && styles.metricSpend]} numberOfLines={1}>{value}</Text></View>;
}

function Timeline({ rows }: { rows: PeriodicReport['timeline'] }) {
  const max = Math.max(...rows.map((row) => row.expenses), 1);
  return (
    <View style={styles.chart}>
      {rows.map((row) => (
        <View key={row.date} style={styles.barWrap}>
          <View style={[styles.bar, { height: Math.max((row.expenses / max) * 108, row.expenses ? 4 : 1) }]} />
          <Text style={styles.barLabel}>{row.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 16, backgroundColor: color.card, borderBottomWidth: 1, borderBottomColor: color.line },
  back: { padding: 4 }, headerTitle: { fontFamily: font.bodySemi, fontSize: 18, color: color.ink }, headerSub: { fontFamily: font.body, fontSize: 11, color: color.inkSoft, marginTop: 2 },
  content: { padding: 20, paddingBottom: 42 },
  segment: { flexDirection: 'row', backgroundColor: color.cream2, padding: 4, borderRadius: 15, marginBottom: 18 },
  segmentButton: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 11 }, segmentActive: { backgroundColor: color.card, borderWidth: 1, borderColor: color.line },
  segmentText: { fontFamily: font.bodyMed, fontSize: 12, color: color.inkSoft }, segmentTextActive: { color: color.forest, fontFamily: font.bodyBold },
  loading: { minHeight: 320, alignItems: 'center', justifyContent: 'center', gap: 12 }, loadingText: { fontFamily: font.body, fontSize: 13, color: color.inkSoft }, emptyTitle: { fontFamily: font.displaySemi, fontSize: 20, color: color.ink },
  hero: { backgroundColor: color.forest, borderRadius: 24, padding: 20 }, heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroKicker: { fontFamily: font.bodyBold, fontSize: type.eyebrow, color: onForest.muted, textTransform: 'uppercase', letterSpacing: 1.3 }, heroLabel: { fontFamily: font.body, fontSize: 12, color: onForest.muted, marginTop: 23 }, heroAmount: { fontFamily: font.displayBold, fontSize: 38, color: color.card, marginTop: 3 },
  compare: { fontFamily: font.bodySemi, fontSize: 10, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 99, overflow: 'hidden' }, compareGood: { backgroundColor: color.forest2, color: color.card }, compareWarm: { backgroundColor: color.clay, color: color.card }, compareNeutral: { fontFamily: font.bodyMed, color: onForest.muted, fontSize: 10 },
  heroMetrics: { flexDirection: 'row', gap: 9, marginTop: 20 }, metric: { flex: 1, backgroundColor: color.forest2, borderRadius: 13, padding: 11 }, metricLabel: { fontFamily: font.body, fontSize: 9, color: onForest.muted, textTransform: 'uppercase' }, metricValue: { fontFamily: font.bodySemi, fontSize: 12, color: color.card, marginTop: 4 }, metricSpend: { color: onForest.clay },
  insightCard: { flexDirection: 'row', gap: 11, alignItems: 'flex-start', backgroundColor: color.card, borderRadius: 18, borderWidth: 1, borderColor: color.line, padding: 16, marginTop: 14 }, insightText: { flex: 1, fontFamily: font.bodyMed, fontSize: 12.5, lineHeight: 19, color: color.inkSoft },
  card: { backgroundColor: color.card, borderRadius: 20, borderWidth: 1, borderColor: color.line, padding: 17, marginTop: 14 }, cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, sectionTitle: { fontFamily: font.displaySemi, fontSize: type.sectionHead, color: color.forestDeep }, legend: { fontFamily: font.body, fontSize: 9, color: color.clay }, muted: { fontFamily: font.body, color: color.inkSoft, fontSize: 12, marginTop: 16 },
  chart: { height: 142, flexDirection: 'row', alignItems: 'flex-end', gap: 5, paddingTop: 18 }, barWrap: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: 125 }, bar: { width: '68%', minWidth: 3, maxWidth: 18, backgroundColor: color.clay, borderTopLeftRadius: 5, borderTopRightRadius: 5 }, barLabel: { fontFamily: font.bodyMed, fontSize: 8, color: color.inkFaint, marginTop: 6 },
  categoryRow: { flexDirection: 'row', alignItems: 'center', gap: 11, marginTop: 16 }, categoryIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' }, categoryBody: { flex: 1 }, categoryHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }, categoryName: { fontFamily: font.bodySemi, fontSize: 12, color: color.ink, textTransform: 'capitalize' }, categoryAmount: { fontFamily: font.body, fontSize: 10, color: color.inkSoft },
  goal: { marginTop: 17 }, goalName: { fontFamily: font.bodySemi, fontSize: 12, color: color.ink }, goalPct: { fontFamily: font.bodyBold, fontSize: 11, color: color.forest }, goalAmount: { fontFamily: font.body, fontSize: 10, color: color.inkSoft, marginTop: 7 },
});
