import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenShell from '../components/ScreenShell';
import { useFocusEffect } from '@react-navigation/native';
import { useData } from '../context/DataContext';
import BudgetCard from '../components/BudgetCard';
import CategoryPicker from '../components/CategoryPicker';
import DeleteConfirmSheet from '../components/DeleteConfirmSheet';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import ErrorBanner from '../components/ui/ErrorBanner';
import Button from '../components/ui/Button';
import Icon from '../components/ui/Icon';
import ProgressBar from '../components/ui/ProgressBar';
import { font } from '../theme/tokens';
import { useColors } from '../context/ThemeContext';
import type { Palette } from '../theme/palettes';
import { usePrivacy } from '../context/PrivacyContext';
import { getCurrentMonth } from '../utils/dateHelpers';
import { useHaptics } from '../hooks/useHaptics';
import { useLocale } from '../hooks/useLocale';
import { parseAmountInput } from '../utils/locale';
import { effectiveProgress } from '../utils/budgetRollover';
import type { Budget } from '../types';

export default function BudgetScreen() {
  const { budgets, overallBudget, loadingData, refreshing, fetchBudgets, saveBudget, deleteBudget, saveOverallBudget, refresh, userCategories, fetchUserCategories } =
    useData();
  const { locale } = useLocale();
  const haptics = useHaptics();
  const c = useColors();
  const styles = useMemo(() => makeStyles(c), [c]);
  const insets = useSafeAreaInsets();
  const { formatAmount } = usePrivacy();

  const [showModal, setShowModal] = useState(false);
  const [editBudget, setEditBudget] = useState<Budget | null>(null);
  const [category, setCategory] = useState('food');
  const [limit, setLimit] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toDelete, setToDelete] = useState<Budget | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Overall monthly budget
  const [showOverallModal, setShowOverallModal] = useState(false);
  const [overallLimit, setOverallLimit] = useState('');
  const [savingOverall, setSavingOverall] = useState(false);
  const [overallError, setOverallError] = useState('');

  useFocusEffect(
    useCallback(() => {
      fetchBudgets();
      if (userCategories.length === 0) fetchUserCategories();
    }, [fetchBudgets, userCategories.length, fetchUserCategories])
  );

  const totalBudget = budgets.reduce((s, b) => s + b.limit, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);
  const overBudgetCount = budgets.filter(
    (b) => effectiveProgress(b.spent, b.available ?? b.limit).isOver
  ).length;

  const overallSet = overallBudget?.limit != null && overallBudget.limit > 0;
  const overallProg = overallSet
    ? effectiveProgress(overallBudget!.spent, overallBudget!.limit!)
    : null;

  const openAdd = () => {
    setEditBudget(null);
    setCategory('food');
    setLimit('');
    setError('');
    setShowModal(true);
  };

  const openEdit = (budget: Budget) => {
    setEditBudget(budget);
    setCategory(budget.category);
    setLimit(String(budget.limit));
    setError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    setError('');
    const lmt = parseAmountInput(limit, locale);
    if (lmt === null) {
      setError('Enter a valid budget amount');
      return;
    }
    setSaving(true);
    try {
      await saveBudget({ category, limit: lmt, month: getCurrentMonth() });
      haptics.medium();
      setShowModal(false);
    } catch {
      setError('Failed to save budget');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await deleteBudget(toDelete.id);
      haptics.success();
    } catch {
      haptics.error();
    } finally {
      setDeleting(false);
      setToDelete(null);
    }
  };

  // Overall monthly budget handlers
  const openOverallEdit = () => {
    setOverallLimit(overallBudget?.limit != null ? String(overallBudget.limit) : '');
    setOverallError('');
    setShowOverallModal(true);
  };

  const handleSaveOverall = async () => {
    setOverallError('');
    const lmt = parseAmountInput(overallLimit, locale);
    if (lmt === null) {
      setOverallError('Enter a valid budget amount');
      return;
    }
    setSavingOverall(true);
    try {
      await saveOverallBudget({ month: getCurrentMonth(), limit: lmt });
      haptics.medium();
      setShowOverallModal(false);
    } catch {
      setOverallError('Failed to save overall budget');
    } finally {
      setSavingOverall(false);
    }
  };

  const handleClearOverall = async () => {
    setOverallError('');
    setSavingOverall(true);
    try {
      await saveOverallBudget({ month: getCurrentMonth(), limit: null });
      haptics.medium();
      setShowOverallModal(false);
    } catch {
      setOverallError('Failed to clear overall budget');
    } finally {
      setSavingOverall(false);
    }
  };

  return (
    <ScreenShell edges={['top']} backgroundColor={c.cream}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={c.forest}
            colors={[c.forest]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Budget</Text>
          <TouchableOpacity style={styles.addBtn} onPress={openAdd} activeOpacity={0.8}>
            <Text style={styles.addBtnText}>+ Add</Text>
          </TouchableOpacity>
        </View>

        {/* Overall monthly budget */}
        {overallSet && overallProg ? (
          <View style={styles.overallCard}>
            <View style={styles.overallHeader}>
              <Text style={styles.overallTitle}>Overall Monthly Budget</Text>
              <TouchableOpacity
                onPress={openOverallEdit}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityLabel="Edit overall budget"
                accessibilityRole="button"
              >
                <Icon name="edit" size={16} color={c.inkSoft} />
              </TouchableOpacity>
            </View>
            <Text style={styles.overallMeta}>
              {formatAmount(overallBudget!.spent)} of {formatAmount(overallBudget!.limit!)}
            </Text>
            <ProgressBar
              percentage={overallProg.percentage}
              color={overallProg.isOver ? c.clay : c.forest}
            />
            <Text style={[styles.overallRemaining, overallProg.isOver ? styles.danger : null]}>
              {overallProg.isOver
                ? `${formatAmount(Math.abs(overallProg.remaining))} over`
                : `${formatAmount(overallProg.remaining)} left`}
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.overallSetCard}
            onPress={openOverallEdit}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Set an overall monthly budget"
          >
            <Icon name="target" size={18} color={c.forest} />
            <Text style={styles.overallSetText}>Set an overall monthly budget</Text>
            <Icon name="chevron-right" size={16} color={c.inkFaint} />
          </TouchableOpacity>
        )}

        {/* Summary */}
        {budgets.length > 0 && (
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Total Budgeted</Text>
                <Text style={styles.summaryValue}>{formatAmount(totalBudget)}</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Total Spent</Text>
                <Text
                  style={[
                    styles.summaryValue,
                    totalSpent > totalBudget ? styles.danger : null,
                  ]}
                >
                  {formatAmount(totalSpent)}
                </Text>
              </View>
            </View>
            {overBudgetCount > 0 && (
              <View style={styles.overWarning}>
                <Text style={styles.overWarningText}>
                  ⚠️ {overBudgetCount} {overBudgetCount === 1 ? 'category' : 'categories'} over budget
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Budget List */}
        {loadingData ? (
          <LoadingSpinner />
        ) : budgets.length === 0 ? (
          <EmptyState
            emoji="🎯"
            title="No budgets set"
            subtitle="Set spending limits for each category to stay on track"
            actionLabel="Create Budget"
            onAction={openAdd}
          />
        ) : (
          budgets.map((b) => (
            <BudgetCard
              key={b.id}
              budget={b}
              onEdit={openEdit}
              onDelete={(id) => {
                haptics.warning();
                const found = budgets.find((bgt) => bgt.id === id);
                if (found) setToDelete(found);
              }}
            />
          ))
        )}
      </ScrollView>

      {/* Budget Add/Edit Modal */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            onPress={() => setShowModal(false)}
            activeOpacity={1}
          />
          <View style={[styles.modalSheet, { paddingBottom: Math.max(insets.bottom, 24) + 16 }]}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>
              {editBudget ? 'Edit Budget' : 'New Budget'}
            </Text>

            <ErrorBanner message={error} />

            <Text style={styles.sectionLabel}>Category</Text>
            <CategoryPicker
              selected={category}
              type="expense"
              onSelect={setCategory}
              customCategories={userCategories}
            />

            <Text style={[styles.sectionLabel, { marginTop: 20 }]}>Monthly Limit ({locale.symbol})</Text>
            <View style={styles.limitRow}>
              <Text style={styles.rupee}>{locale.symbol}</Text>
              <TextInput
                style={styles.limitInput}
                value={limit}
                onChangeText={setLimit}
                placeholder="5000"
                placeholderTextColor={c.inkFaint}
                keyboardType={locale.usesDecimalAmounts ? 'decimal-pad' : 'numeric'}
                returnKeyType="done"
                selectionColor={c.forest}
                onSubmitEditing={handleSave}
              />
            </View>

            <Button onPress={handleSave} loading={saving} fullWidth style={{ marginTop: 24 }}>
              {editBudget ? 'Update Budget' : 'Set Budget'}
            </Button>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Overall Budget Modal */}
      <Modal visible={showOverallModal} transparent animationType="slide" onRequestClose={() => setShowOverallModal(false)}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            onPress={() => setShowOverallModal(false)}
            activeOpacity={1}
          />
          <View style={[styles.modalSheet, { paddingBottom: Math.max(insets.bottom, 24) + 16 }]}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Overall Monthly Budget</Text>

            <ErrorBanner message={overallError} />

            <Text style={styles.sectionLabel}>Total spending limit ({locale.symbol})</Text>
            <View style={styles.limitRow}>
              <Text style={styles.rupee}>{locale.symbol}</Text>
              <TextInput
                style={styles.limitInput}
                value={overallLimit}
                onChangeText={setOverallLimit}
                placeholder="30000"
                placeholderTextColor={c.inkFaint}
                keyboardType={locale.usesDecimalAmounts ? 'decimal-pad' : 'numeric'}
                returnKeyType="done"
                selectionColor={c.forest}
                onSubmitEditing={handleSaveOverall}
              />
            </View>

            <Button onPress={handleSaveOverall} loading={savingOverall} fullWidth style={{ marginTop: 24 }}>
              {overallSet ? 'Update Overall Budget' : 'Set Overall Budget'}
            </Button>
            {overallSet && (
              <TouchableOpacity
                onPress={handleClearOverall}
                style={styles.clearBtn}
                disabled={savingOverall}
                accessibilityRole="button"
              >
                <Text style={styles.clearBtnText}>Clear overall budget</Text>
              </TouchableOpacity>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <DeleteConfirmSheet
        visible={!!toDelete}
        title="Delete Budget?"
        message="This will remove the budget limit for this category."
        onConfirm={handleDeleteConfirm}
        onCancel={() => setToDelete(null)}
        loading={deleting}
      />
    </ScreenShell>
  );
}

const makeStyles = (c: Palette) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.cream },
  container: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 20,
  },
  title: { fontFamily: font.displayBold, fontSize: 26, color: c.ink },
  addBtn: {
    backgroundColor: c.forest, paddingHorizontal: 16,
    paddingVertical: 8, borderRadius: 20,
  },
  addBtnText: { fontFamily: font.bodySemi, fontSize: 14, color: c.cream },
  summaryCard: {
    backgroundColor: c.card, borderRadius: 16,
    borderWidth: 1, borderColor: c.line,
    padding: 16, marginBottom: 20,
  },
  summaryRow: { flexDirection: 'row', alignItems: 'center' },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryDivider: { width: 1, height: 40, backgroundColor: c.line },
  summaryLabel: { fontFamily: font.body, fontSize: 12, color: c.inkSoft, marginBottom: 4 },
  summaryValue: { fontFamily: font.displaySemi, fontSize: 20, color: c.ink },
  danger: { color: c.clay },
  overallCard: {
    backgroundColor: c.card, borderRadius: 16,
    borderWidth: 1, borderColor: c.line,
    padding: 16, marginBottom: 20,
  },
  overallHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 6,
  },
  overallTitle: { fontFamily: font.bodySemi, fontSize: 14, color: c.ink },
  overallMeta: { fontFamily: font.body, fontSize: 12, color: c.inkSoft, marginBottom: 10 },
  overallRemaining: { fontFamily: font.body, fontSize: 12, color: c.inkSoft, marginTop: 8 },
  overallSetCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: c.card, borderRadius: 16,
    borderWidth: 1, borderColor: c.line, borderStyle: 'dashed',
    padding: 16, marginBottom: 20,
  },
  overallSetText: { flex: 1, fontFamily: font.bodySemi, fontSize: 14, color: c.ink },
  clearBtn: { marginTop: 16, alignItems: 'center', paddingVertical: 8 },
  clearBtnText: { fontFamily: font.bodySemi, fontSize: 14, color: c.clay },
  overWarning: {
    marginTop: 12, backgroundColor: c.clayTint,
    borderRadius: 8, padding: 10, borderWidth: 1, borderColor: c.line,
  },
  overWarningText: { fontFamily: font.body, fontSize: 13, color: c.clay, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(35,41,31,0.55)' },
  modalSheet: {
    backgroundColor: c.card, borderTopLeftRadius: 24,
    borderTopRightRadius: 24, padding: 24, paddingBottom: 40,
    borderTopWidth: 1, borderColor: c.line,
  },
  modalHandle: {
    width: 40, height: 4, backgroundColor: c.line,
    borderRadius: 2, alignSelf: 'center', marginBottom: 20,
  },
  modalTitle: {
    fontFamily: font.displaySemi, fontSize: 20, color: c.ink, marginBottom: 20,
  },
  sectionLabel: { fontFamily: font.bodySemi, fontSize: 13, color: c.inkSoft, marginBottom: 12 },
  limitRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: c.cream2, borderRadius: 12,
    borderWidth: 1, borderColor: c.line, paddingHorizontal: 14,
  },
  rupee: { fontFamily: font.bodySemi, fontSize: 22, color: c.inkFaint },
  limitInput: { flex: 1, fontFamily: font.displaySemi, fontSize: 24, color: c.ink, paddingVertical: 12 },
});
