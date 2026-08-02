import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import ScreenShell from '../components/ScreenShell';
import Icon from '../components/ui/Icon';
import EmptyState from '../components/ui/EmptyState';
import DeleteConfirmSheet from '../components/DeleteConfirmSheet';
import { color, font, type as typeScale } from '../theme/tokens';
import { useData } from '../context/DataContext';
import { useHaptics } from '../hooks/useHaptics';
import { useLocale } from '../hooks/useLocale';
import { getCategoryDef } from '../constants/categories';
import { nextDueForTemplate } from '../lib/recurringEngine';
import { totalMonthlyRecurringCost } from '../lib/recurringCost';
import type { MainStackParamList } from '../navigation/navigationTypes';
import type { Transaction } from '../types';

type Nav = StackNavigationProp<MainStackParamList>;

type Template = Transaction & {
  recurrenceRule: NonNullable<Transaction['recurrenceRule']>;
};

const RULE_LABELS: Record<Template['recurrenceRule'], string> = {
  monthly: 'Monthly',
  weekly: 'Weekly',
  biweekly: 'Biweekly',
  quarterly: 'Quarterly',
  yearly: 'Yearly',
};

function formatDueDate(iso: string, localeTag: string): string {
  try {
    return new Date(iso + 'T00:00:00').toLocaleDateString(localeTag, {
      day: 'numeric',
      month: 'short',
    });
  } catch {
    return iso;
  }
}

/**
 * Recurring Payments (Phase 1). Lists every recurring TEMPLATE (isRecurring,
 * no parentRecurringId) with its next due date, plus the monthly-equivalent
 * cost of the active ones. Per-template actions: edit (reuses the fast-entry
 * edit flow), pause/resume (isPaused — the recurringEngine then skips it in
 * both generation and projection), and stop series (deletes only the
 * template; past child instances are kept).
 */
export default function RecurringPaymentsScreen() {
  const navigation = useNavigation<Nav>();
  const { transactions, updateTransaction, deleteTransaction } = useData();
  const { locale, formatCurrency } = useLocale();
  const haptics = useHaptics();
  const insets = useSafeAreaInsets();

  const [actionFor, setActionFor] = useState<Template | null>(null);
  const [stopFor, setStopFor] = useState<Template | null>(null);
  const [busy, setBusy] = useState(false);

  const templates = useMemo<Template[]>(
    () =>
      transactions.filter(
        (t): t is Template =>
          t.isRecurring === true && t.parentRecurringId == null && t.recurrenceRule != null
      ),
    [transactions]
  );

  const monthlyCost = useMemo(() => totalMonthlyRecurringCost(transactions), [transactions]);
  const activeCount = templates.filter((t) => t.isPaused !== true).length;
  const pausedCount = templates.length - activeCount;

  const openActions = (t: Template) => {
    haptics.medium();
    setActionFor(t);
  };

  const handleEdit = (t: Template) => {
    haptics.light();
    setActionFor(null);
    navigation.navigate('AddTransaction', {
      editTransaction: {
        id: t.id,
        type: t.type,
        amount: t.amount,
        category: t.category,
        description: t.description,
        note: t.note,
        date: t.date,
        isRecurring: true,
        recurrenceRule: t.recurrenceRule,
      },
    });
  };

  const handleTogglePause = async (t: Template) => {
    setActionFor(null);
    const pausing = t.isPaused !== true;
    const outcome = await updateTransaction(t.id, { isPaused: pausing });
    if (outcome.ok) {
      haptics.success();
    } else {
      haptics.error();
    }
  };

  const handleStopSeries = async () => {
    if (!stopFor) return;
    setBusy(true);
    try {
      await deleteTransaction(stopFor.id);
      haptics.success();
    } catch {
      haptics.error();
    } finally {
      setBusy(false);
      setStopFor(null);
    }
  };

  const renderRow = ({ item }: { item: Template }) => {
    const cat = getCategoryDef(item.category);
    const paused = item.isPaused === true;
    const nextDue = paused ? null : nextDueForTemplate(item, new Date());

    return (
      <TouchableOpacity
        style={[styles.row, paused && styles.rowPaused]}
        activeOpacity={0.85}
        onPress={() => openActions(item)}
        accessibilityRole="button"
        accessibilityLabel={`${item.description || cat.label}, ${RULE_LABELS[item.recurrenceRule]}, ${formatCurrency(item.amount)}${paused ? ', paused' : ''}`}
      >
        <View style={[styles.emojiDot, { backgroundColor: cat.color + '22' }]}>
          <Text style={styles.emoji}>{cat.emoji}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.name, paused && styles.namePaused]} numberOfLines={1}>
            {item.description || cat.label}
          </Text>
          <Text style={styles.meta}>
            {RULE_LABELS[item.recurrenceRule]}
            {paused
              ? ' · Paused'
              : nextDue
                ? ` · Next ${formatDueDate(nextDue.nextDueDate, locale.localeTag)}`
                : ''}
          </Text>
        </View>
        {paused && (
          <View style={styles.pausedBadge}>
            <Text style={styles.pausedBadgeText}>Paused</Text>
          </View>
        )}
        <Text style={[styles.amount, item.type === 'income' && { color: color.forest2 }]}>
          {item.type === 'income' ? '+' : '−'}
          {formatCurrency(item.amount)}
        </Text>
        <Icon name="chevron-right" size={16} color={color.inkFaint} />
      </TouchableOpacity>
    );
  };

  return (
    <ScreenShell edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Icon name="arrow-left" size={22} color={color.ink} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Recurring Payments</Text>
          <Text style={styles.headerSub}>Subscriptions & repeating entries</Text>
        </View>
      </View>

      <FlatList
        data={templates}
        keyExtractor={(t) => t.id}
        renderItem={renderRow}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          templates.length > 0 ? (
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>ACTIVE RECURRING COST</Text>
              <Text style={styles.summaryAmount}>
                {formatCurrency(Math.round(monthlyCost))}
                <Text style={styles.summaryPer}> / month</Text>
              </Text>
              <Text style={styles.summaryMeta}>
                {activeCount} active
                {pausedCount > 0 ? ` · ${pausedCount} paused` : ''}
              </Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <EmptyState
            emoji="🔁"
            title="No recurring payments"
            subtitle="Mark a transaction as Repeat when adding it and it will show up here."
          />
        }
      />

      {/* Per-template action sheet */}
      <Modal
        visible={!!actionFor}
        transparent
        animationType="slide"
        onRequestClose={() => setActionFor(null)}
      >
        <TouchableOpacity
          style={styles.sheetBackdrop}
          activeOpacity={1}
          onPress={() => setActionFor(null)}
          accessibilityLabel="Dismiss actions"
        />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) + 18 }]}>
          <View style={styles.sheetHandle} />
          {actionFor && (
            <>
              <Text style={styles.sheetTitle} numberOfLines={1}>
                {actionFor.description || getCategoryDef(actionFor.category).label}
              </Text>
              <Text style={styles.sheetMeta}>
                {RULE_LABELS[actionFor.recurrenceRule]} · {formatCurrency(actionFor.amount)}
              </Text>

              <TouchableOpacity
                style={styles.sheetAction}
                onPress={() => handleEdit(actionFor)}
                accessibilityRole="button"
                accessibilityLabel="Edit recurring payment"
              >
                <Icon name="edit" size={18} color={color.forest} />
                <Text style={styles.sheetActionText}>Edit amount, schedule or note</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sheetAction}
                onPress={() => handleTogglePause(actionFor)}
                accessibilityRole="button"
                accessibilityLabel={actionFor.isPaused ? 'Resume recurring payment' : 'Pause recurring payment'}
              >
                <Icon name={actionFor.isPaused ? 'play' : 'moon'} size={18} color={color.forest} />
                <Text style={styles.sheetActionText}>
                  {actionFor.isPaused ? 'Resume — start generating again' : 'Pause — stop generating for now'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sheetAction}
                onPress={() => {
                  haptics.warning();
                  setStopFor(actionFor);
                  setActionFor(null);
                }}
                accessibilityRole="button"
                accessibilityLabel="Stop recurring series"
              >
                <Icon name="trash" size={18} color={color.clay} />
                <Text style={[styles.sheetActionText, { color: color.clay }]}>
                  Stop series — no more repeats
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </Modal>

      <DeleteConfirmSheet
        visible={!!stopFor}
        title="Stop this recurring payment?"
        message="This is a recurring payment. Deleting it stops all future repeats; past entries are kept."
        confirmLabel="Stop series"
        onConfirm={handleStopSeries}
        onCancel={() => setStopFor(null)}
        loading={busy}
      />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 8,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: color.lineStrong,
    backgroundColor: color.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontFamily: font.displaySemi, fontSize: typeScale.screenTitle, color: color.forestDeep },
  headerSub: { fontFamily: font.body, fontSize: typeScale.caption, color: color.inkSoft, marginTop: 1 },
  listContent: { paddingHorizontal: 20, paddingBottom: 24 },
  summaryCard: {
    backgroundColor: color.forest,
    borderRadius: 16,
    padding: 18,
    marginTop: 8,
    marginBottom: 16,
  },
  summaryLabel: {
    fontFamily: font.bodyBold,
    fontSize: typeScale.eyebrow,
    letterSpacing: 1.6,
    color: '#A9C6BD',
  },
  summaryAmount: {
    fontFamily: font.display,
    fontSize: 34,
    color: '#FBF8F0',
    marginTop: 6,
  },
  summaryPer: { fontFamily: font.body, fontSize: 14, color: '#A9C6BD' },
  summaryMeta: { fontFamily: font.bodyMed, fontSize: typeScale.caption, color: '#EFEAD9', marginTop: 6 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: color.card,
    borderWidth: 1,
    borderColor: color.line,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  rowPaused: { opacity: 0.75 },
  emojiDot: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 18 },
  name: { fontFamily: font.bodySemi, fontSize: 14, color: color.ink },
  namePaused: { color: color.inkSoft },
  meta: { fontFamily: font.body, fontSize: typeScale.caption, color: color.inkSoft, marginTop: 2 },
  pausedBadge: {
    backgroundColor: color.cream2,
    borderWidth: 1,
    borderColor: color.lineStrong,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  pausedBadgeText: { fontFamily: font.bodySemi, fontSize: 10.5, color: color.inkSoft },
  amount: { fontFamily: font.bodySemi, fontSize: 14, color: color.ink },
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(21,42,30,0.35)' },
  sheet: {
    backgroundColor: color.cream,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 22,
    borderTopWidth: 1,
    borderColor: color.line,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: color.line,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetTitle: { fontFamily: font.displaySemi, fontSize: typeScale.sectionHead, color: color.forestDeep },
  sheetMeta: { fontFamily: font.body, fontSize: typeScale.caption, color: color.inkSoft, marginTop: 2, marginBottom: 14 },
  sheetAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: color.card,
    borderWidth: 1,
    borderColor: color.line,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 10,
  },
  sheetActionText: { fontFamily: font.bodySemi, fontSize: 13.5, color: color.ink, flex: 1 },
});
