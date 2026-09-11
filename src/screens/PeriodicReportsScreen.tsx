import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { MainStackParamList } from '../navigation/navigationTypes';
import { getPeriodicReport, type PeriodicReport, type ReportPeriod } from '../api/reports';
import ScreenShell from '../components/ScreenShell';
import { useLocale } from '../hooks/useLocale';
import { usePrivacy } from '../context/PrivacyContext';
import { useLanguage } from '../i18n/LanguageContext';
import { color, font, onForest, type } from '../theme/tokens';
import { track } from '../lib/analytics';

const PERIODS: ReportPeriod[] = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'];

export default function PeriodicReportsScreen() {
  const route = useRoute<RouteProp<MainStackParamList, 'PeriodicReports'>>();
  const navigation = useNavigation<StackNavigationProp<MainStackParamList>>();
  const { locale } = useLocale();
  const { isPrivate } = usePrivacy();
  const { language, t } = useLanguage();
  const [period, setPeriod] = useState<ReportPeriod>(route.params?.period ?? 'weekly');
  const [report, setReport] = useState<PeriodicReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [anchor, setAnchor] = useState<string | undefined>(route.params?.anchor);
  useEffect(() => { if (route.params) { setPeriod(route.params.period); setAnchor(route.params.anchor); } }, [route.params]);
  const requestId = useRef(0);
  const money = (value: number) => isPrivate ? '••••' : new Intl.NumberFormat(language === 'hi' ? 'hi-IN' : locale.localeTag, { style: 'currency', currency: locale.currency, maximumFractionDigits: locale.usesDecimalAmounts ? 2 : 0 }).format(value);
  const day = (value: string) => new Date(`${value}T12:00:00`).toLocaleDateString(language === 'hi' ? 'hi-IN' : locale.localeTag, { day: 'numeric', month: 'short', year: 'numeric' });
  const load = useCallback(async (refresh = false) => {
    const id = ++requestId.current;
    if (refresh) setRefreshing(true); else setLoading(true);
    try {
      const value = await getPeriodicReport(period, language, anchor);
      if (id !== requestId.current) return;
      setReport(value);
      track('periodic_report_viewed', { period, has_data: value.totals.transactionCount > 0, language });
    } catch { if (id === requestId.current) setReport(null); }
    finally { if (id === requestId.current) { setLoading(false); setRefreshing(false); } }
  }, [period, language, anchor]);
  useFocusEffect(useCallback(() => { void load(); return () => { requestId.current += 1; }; }, [load]));
  return (
    <ScreenShell edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel={t('back')} style={{ padding: 12 }}><Text>←</Text></TouchableOpacity>
        <View style={{ flex: 1 }}><Text style={styles.headerTitle}>{t('reports')}</Text><Text style={styles.headerSub}>{t('reportSubtitle')}</Text></View>
      </View>
      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} />}>
        <View style={[styles.segment, { flexWrap: 'wrap' }]}>{PERIODS.map(key => (
          <TouchableOpacity key={key} accessibilityRole="button" accessibilityState={{ selected: key === period }} onPress={() => { setPeriod(key); setAnchor(undefined); }} style={[styles.segmentButton, { minWidth: '30%', paddingHorizontal: 6 }, key === period && styles.segmentActive]}>
            <Text style={styles.segmentText}>{t(key)}</Text>
          </TouchableOpacity>
        ))}</View>
        {loading ? <ActivityIndicator accessibilityLabel={t('loading')} /> : !report ? (
          <View style={styles.card}><Text>{t('unavailable')}</Text><TouchableOpacity onPress={() => void load()} accessibilityRole="button" style={{ paddingVertical: 16 }}><Text>{t('retry')}</Text></TouchableOpacity></View>
        ) : <>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 16 }}>
            <TouchableOpacity accessibilityRole="button" onPress={() => {
              const value = new Date(`${report.start}T12:00:00`); value.setDate(value.getDate() - 1);
              setAnchor(`${value.getFullYear()}-${String(value.getMonth()+1).padStart(2,'0')}-${String(value.getDate()).padStart(2,'0')}`);
            }}><Text>{t('previous')}</Text></TouchableOpacity>
            {anchor && <TouchableOpacity accessibilityRole="button" onPress={() => setAnchor(undefined)}><Text>{t('today')}</Text></TouchableOpacity>}
          </View>
          <View style={styles.hero}>
            <Text style={styles.heroKicker}>{day(report.start)} – {day(report.end)}</Text>
            <Text style={styles.heroLabel}>{t('net')}</Text><Text style={styles.heroAmount}>{money(report.totals.net)}</Text>
            <View style={[styles.heroMetrics, { flexWrap: 'wrap' }]}>
              <Metric label={t('income')} value={money(report.totals.income)} />
              <Metric label={t('spending')} value={money(report.totals.expenses)} />
              <Metric label={t('entries')} value={isPrivate ? '••••' : String(report.totals.transactionCount)} />
            </View>
          </View>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t('evidence')}</Text>
            <Text style={styles.muted}>{t('limits')}</Text>
            {isPrivate ? <Text style={styles.muted}>{t('private')}</Text> : <>
              {report.evidence?.map(item => <Text key={item.code} style={styles.muted}>{t(item.kind)} · {item.text}</Text>)}
              {report.comparison.start && report.comparison.end && <Text style={styles.muted}>{t('comparison', { start: day(report.comparison.start), end: day(report.comparison.end) })}</Text>}
              <Text style={styles.muted}>{report.comparison.expensesChange === null ? t('noBaseline') : t('spendChange', { change: report.comparison.expensesChange })}</Text>
            </>}
          </View>
          {!isPrivate && <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t('rhythm')}</Text>
            <View style={styles.chart}>{Array.from({ length: Math.min(12, report.timeline.length) }, (_, index) => {
              const size = Math.ceil(report.timeline.length / 12);
              const rows = report.timeline.slice(index * size, (index + 1) * size);
              if (!rows.length) return null;
              const amount = rows.reduce((sum, row) => sum + row.expenses, 0);
              return <View key={index} style={styles.barWrap} accessible accessibilityLabel={`${day(rows[0].date)}: ${money(amount)}`}><View style={[styles.bar, { height: Math.max(2, 108 * amount / Math.max(1, report.totals.expenses)) }]} /><Text style={styles.barLabel}>{new Date(`${rows[0].date}T12:00:00`).getDate()}</Text></View>;
            })}</View>
            <Text style={styles.sectionTitle}>{t('categories')}</Text>
            {!report.categories.length && <Text style={styles.muted}>{t('noCategories')}</Text>}
            {report.categories.map(category => <View key={category.name} style={styles.categoryRow}><Text style={{ flex: 1 }}>{category.name}</Text><Text>{money(category.amount)}</Text></View>)}
            {!!report.categoryChanges?.length && <Text style={[styles.sectionTitle, { marginTop: 20 }]}>{t('changes')}</Text>}
            {report.categoryChanges?.slice(0, 4).map(item => <View key={item.name} style={styles.categoryRow}><Text style={{ flex: 1 }}>{item.name}</Text><Text>{money(item.delta)}</Text></View>)}
          </View>}
          {!isPrivate && report.goals.length > 0 && <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t('goals')}</Text><Text style={styles.muted}>{t('currentGoals')}</Text>
            {report.goals.map(goal => <View key={goal.id} style={styles.categoryRow}><Text style={{ flex: 1 }}>{goal.name}</Text><Text>{money(goal.current)} / {money(goal.target)}</Text></View>)}
          </View>}
          <TouchableOpacity accessibilityRole="button" onPress={() => { track('report_action_started', { period, action: 'review_entries' }); navigation.navigate('SmartLedger'); }} style={styles.card}><Text style={styles.sectionTitle}>{t('reviewEntries')} →</Text></TouchableOpacity>
        </>}
      </ScrollView>
    </ScreenShell>
  );
}
function Metric({ label, value }: { label: string; value: string }) {
  return <View style={[styles.metric, { minWidth: 100 }]}><Text style={styles.metricLabel}>{label}</Text><Text style={styles.metricValue}>{value}</Text></View>;
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
