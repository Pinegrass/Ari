import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  SectionList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useData } from '../context/DataContext';
import TransactionItem from '../components/TransactionItem';
import DeleteConfirmSheet from '../components/DeleteConfirmSheet';
import EmptyState from '../components/ui/EmptyState';
import { SkeletonList } from '../components/ui/Skeleton';
import AnimatedFAB from '../components/ui/AnimatedFAB';
import AnimatedEntry from '../components/ui/AnimatedEntry';
import Icon from '../components/ui/Icon';
import TrendLineChart from '../components/trends/TrendLineChart';
import UpcomingChargesSection from '../components/trends/UpcomingChargesSection';
import CategoryComparison from '../components/trends/CategoryComparison';
import InsightCard from '../components/trends/InsightCard';
import { font, type as ftype } from '../theme/tokens';
import { useColors } from '../context/ThemeContext';
import type { Palette } from '../theme/palettes';
import { groupTransactionsByDate } from '../utils/dateHelpers';
import { usePrivacy } from '../context/PrivacyContext';
import { useHaptics } from '../hooks/useHaptics';
import * as reportsApi from '../api/reports';
import type { Transaction, PnlReport } from '../types';
import type { TabParamList, MainStackParamList } from '../navigation/navigationTypes';

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Transactions'>,
  StackNavigationProp<MainStackParamList>
>;

type FilterType = 'all' | 'expense' | 'income';
type PeriodType = 1 | 6 | 12;

const PERIODS: { value: PeriodType; label: string }[] = [
  { value: 1, label: 'This month' },
  { value: 6, label: '6 months' },
  { value: 12, label: '1 year' },
];

export default function TransactionsScreen() {
  const navigation = useNavigation<Nav>();
  const c = useColors();
  const styles = useMemo(() => makeStyles(c), [c]);
  const {
    transactions,
    summary,
    insights,
    nudge,
    refreshing,
    loadingData,
    deleteTransaction,
    fetchTransactions,
    fetchSummary,
    refresh,
  } = useData();
  const haptics = useHaptics();
  const insets = useSafeAreaInsets();
  const { formatAmount } = usePrivacy();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [toDelete, setToDelete] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [period, setPeriod] = useState<PeriodType>(6);
  const [pnl, setPnl] = useState<PnlReport | null>(null);
  const [pnlLoading, setPnlLoading] = useState(false);

  const loadPnl = useCallback(async (months: PeriodType) => {
    setPnlLoading(true);
    try {
      const data = await reportsApi.getPnlReport(months);
      setPnl(data);
    } catch {
      setPnl(null);
    } finally {
      setPnlLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchTransactions();
      fetchSummary();
      loadPnl(period);
    }, [fetchTransactions, fetchSummary, loadPnl, period])
  );

  const filtered = useMemo(() => {
    return transactions.filter((txn) => {
      const matchesFilter = filter === 'all' || txn.type === filter;
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        txn.description.toLowerCase().includes(q) ||
        txn.category.toLowerCase().includes(q) ||
        txn.note?.toLowerCase().includes(q);
      return matchesFilter && matchesSearch;
    });
  }, [transactions, filter, search]);

  const sections = useMemo(() => groupTransactionsByDate(filtered), [filtered]);

  const income = summary?.income ?? 0;
  const expenses = summary?.expenses ?? 0;
  const savings = income - expenses;
  const savingsRate = income > 0 ? Math.round((savings / income) * 100) : 0;

  const handleDeleteConfirm = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await deleteTransaction(toDelete.id);
      haptics.success();
    } catch {
      haptics.error();
    } finally {
      setDeleting(false);
      setToDelete(null);
    }
  };

  const handleDeletePress = (id: string) => {
    const txn = transactions.find((t) => t.id === id);
    if (txn) {
      haptics.warning();
      setToDelete(txn);
    }
  };

  const handlePeriodChange = (p: PeriodType) => {
    haptics.light();
    setPeriod(p);
    loadPnl(p);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TransactionItem
            transaction={item}
            onDelete={handleDeletePress}
            onEdit={(t) =>
              navigation.navigate('AddTransaction', {
                editTransaction: {
                  id: t.id,
                  type: t.type,
                  amount: t.amount,
                  category: t.category,
                  description: t.description,
                  note: t.note,
                  date: t.date,
                },
              })
            }
            showDelete
          />
        )}
        renderSectionHeader={({ section }) => (
          <Text style={styles.dateHeader}>{section.title}</Text>
        )}
        contentContainerStyle={[styles.listContent, { paddingBottom: 60 + insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={c.forest}
            colors={[c.forest]}
          />
        }
        ListHeaderComponent={
          <View>
            {/* Header */}
            <AnimatedEntry delay={0}>
              <Text style={styles.screenTitle}>Trends</Text>
            </AnimatedEntry>

            {/* Period selector */}
            <AnimatedEntry delay={40}>
              <View style={styles.periodRow}>
                {PERIODS.map((p) => (
                  <TouchableOpacity
                    key={p.value}
                    onPress={() => handlePeriodChange(p.value)}
                    style={[styles.periodBtn, period === p.value && styles.periodBtnActive]}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        styles.periodText,
                        period === p.value && styles.periodTextActive,
                      ]}
                    >
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </AnimatedEntry>

            {/* Summary cards */}
            <AnimatedEntry delay={80}>
              <View style={styles.summaryGrid}>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>Income</Text>
                  <Text style={[styles.summaryAmount, styles.incomeText]}>{formatAmount(income)}</Text>
                </View>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>Expenses</Text>
                  <Text style={[styles.summaryAmount, styles.expenseText]}>{formatAmount(expenses)}</Text>
                </View>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>Saved</Text>
                  <Text style={[styles.summaryAmount, savings >= 0 ? styles.incomeText : styles.expenseText]}>
                    {formatAmount(Math.abs(savings))}
                  </Text>
                </View>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>Saved %</Text>
                  <Text style={[styles.summaryAmount, savingsRate >= 20 ? styles.incomeText : styles.expenseText]}>
                    {savingsRate}%
                  </Text>
                </View>
              </View>
            </AnimatedEntry>

            {/* Trend chart */}
            <AnimatedEntry delay={120}>
              <TrendLineChart report={pnl} loading={pnlLoading} />
            </AnimatedEntry>

            {/* Upcoming charges — bills + recurring projections, next 30 days */}
            <AnimatedEntry delay={140}>
              <UpcomingChargesSection />
            </AnimatedEntry>

            {/* Category comparison */}
            <AnimatedEntry delay={160}>
              <CategoryComparison categories={summary?.categories ?? {}} />
            </AnimatedEntry>

            {/* Anomaly / AI callouts */}
            <AnimatedEntry delay={200}>
              <InsightCard nudge={nudge} />
              {insights.slice(0, 2).map((insight, idx) => (
                <InsightCard key={idx} insight={insight} />
              ))}
            </AnimatedEntry>

            {/* Search */}
            <AnimatedEntry delay={240}>
              <View style={styles.searchRow}>
                <Icon name="search" size={16} color={c.inkFaint} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search transactions..."
                  placeholderTextColor={c.inkFaint}
                  value={search}
                  onChangeText={setSearch}
                  selectionColor={c.forest}
                  accessibilityLabel="Search transactions"
                />
                {search.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setSearch('')}
                    accessibilityLabel="Clear search"
                    accessibilityRole="button"
                  >
                    <Icon name="x" size={18} color={c.inkSoft} />
                  </TouchableOpacity>
                )}
              </View>
            </AnimatedEntry>

            {/* Filter Tabs */}
            <AnimatedEntry delay={280}>
              <View style={styles.filters}>
                {(['all', 'expense', 'income'] as FilterType[]).map((f) => (
                  <TouchableOpacity
                    key={f}
                    onPress={() => setFilter(f)}
                    style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
                    activeOpacity={0.75}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: filter === f }}
                    accessibilityLabel={`${f === 'all' ? 'All' : f === 'expense' ? 'Expenses' : 'Income'} filter`}
                  >
                    <Text
                      style={[
                        styles.filterText,
                        filter === f && styles.filterTextActive,
                      ]}
                    >
                      {f === 'all' ? 'All' : f === 'expense' ? 'Expenses' : 'Income'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </AnimatedEntry>

            <AnimatedEntry delay={320}>
              <Text style={styles.listHeading}>Recent transactions</Text>
            </AnimatedEntry>
          </View>
        }
        ListEmptyComponent={
          loadingData && transactions.length === 0 ? (
            <View style={{ paddingHorizontal: 4 }}>
              <SkeletonList count={5} />
            </View>
          ) : (
            <EmptyState
              emoji="💳"
              title="No transactions found"
              subtitle={
                search || filter !== 'all'
                  ? 'Try changing your search or filter'
                  : 'Add your first transaction'
              }
              actionLabel={!search && filter === 'all' ? 'Add Transaction' : undefined}
              onAction={() => navigation.navigate('AddTransaction', { type: 'expense' })}
            />
          )
        }
      />

      {/* Animated FAB */}
      <AnimatedFAB
        onPress={() => {
          haptics.medium();
          navigation.navigate('AddTransaction', { type: 'expense' });
        }}
      />

      <DeleteConfirmSheet
        visible={!!toDelete}
        title="Delete Transaction?"
        message={
          toDelete
            ? `Delete "${toDelete.description || toDelete.category}" of ${formatAmount(toDelete.amount)}?`
            : ''
        }
        onConfirm={handleDeleteConfirm}
        onCancel={() => setToDelete(null)}
        loading={deleting}
      />
    </SafeAreaView>
  );
}

const makeStyles = (c: Palette) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.cream },
  listContent: { paddingHorizontal: 20 },
  screenTitle: {
    fontFamily: font.displayBold,
    fontSize: 26,
    color: c.ink,
    marginTop: 8,
    marginBottom: 16,
  },
  periodRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  periodBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: c.cream2,
    borderWidth: 1,
    borderColor: c.line,
  },
  periodBtnActive: { backgroundColor: c.forest, borderColor: c.forest },
  periodText: { fontFamily: font.bodyMed, fontSize: 12, color: c.inkSoft },
  periodTextActive: { color: c.cream, fontFamily: font.bodySemi },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    minWidth: '45%',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: c.line,
    backgroundColor: c.card,
  },
  summaryLabel: { fontFamily: font.body, fontSize: 11, color: c.inkSoft, marginBottom: 4 },
  summaryAmount: { fontFamily: font.displaySemi, fontSize: 18, color: c.ink },
  incomeText: { color: c.forest2 },
  expenseText: { color: c.clay },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.cream2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: c.line,
    paddingHorizontal: 12,
    marginBottom: 12,
    marginTop: 8,
    gap: 8,
  },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, paddingVertical: 12, fontFamily: font.body, fontSize: ftype.body, color: c.ink },
  filters: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  filterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: c.cream2,
    borderWidth: 1,
    borderColor: c.line,
  },
  filterBtnActive: { backgroundColor: c.forest, borderColor: c.forest },
  filterText: { fontFamily: font.bodyMed, fontSize: 13, color: c.inkSoft },
  filterTextActive: { color: c.cream, fontFamily: font.bodySemi },
  listHeading: {
    fontFamily: font.displaySemi,
    fontSize: ftype.sectionHead,
    color: c.forestDeep,
    marginTop: 8,
    marginBottom: 10,
  },
  dateHeader: {
    fontFamily: font.bodySemi,
    fontSize: 11,
    color: c.inkFaint,
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 4,
    textTransform: 'uppercase',
  },
});
