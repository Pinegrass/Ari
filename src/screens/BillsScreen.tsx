import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Switch,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenShell from '../components/ScreenShell';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';

import Icon from '../components/ui/Icon';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import AnimatedEntry from '../components/ui/AnimatedEntry';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import DeleteConfirmSheet from '../components/DeleteConfirmSheet';
import { useHaptics } from '../hooks/useHaptics';
import { color, font, type as typeScale } from '../theme/tokens';
import { track } from '../lib/analytics';
import {
  getBills,
  saveBill,
  deleteBill,
  ensureNotificationPermission,
  type Bill,
} from '../lib/bills';
import { nextMonthlyOccurrence, toISODate } from '../lib/billSchedule';
import type { MainStackParamList } from '../navigation/navigationTypes';

// Bill-friendly expense categories (must match backend EXPENSE_CATEGORIES so the
// deep-linked fast-entry prefill validates). emoji is display-only.
const BILL_CATEGORIES: { key: string; emoji: string; label: string }[] = [
  { key: 'housing', emoji: '🏠', label: 'Rent/EMI' },
  { key: 'health', emoji: '💊', label: 'Insurance' },
  { key: 'entertainment', emoji: '📺', label: 'Subscriptions' },
  { key: 'education', emoji: '📚', label: 'Fees' },
  { key: 'transport', emoji: '🚗', label: 'Transport' },
  { key: 'other', emoji: '📦', label: 'Other' },
];

function genId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Next due date label for a bill (independent of the 7-day window). */
function nextDueLabel(bill: Bill): string {
  let iso: string;
  if (bill.repeatMonthly) {
    iso = toISODate(nextMonthlyOccurrence(bill.dueDay, new Date()));
  } else {
    iso = bill.oneTimeDate ?? '';
  }
  if (!iso) return 'No upcoming date';
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export default function BillsScreen() {
  const navigation = useNavigation<StackNavigationProp<MainStackParamList>>();
  const haptics = useHaptics();
  const insets = useSafeAreaInsets();

  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal + form state
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Bill | null>(null);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDay, setDueDay] = useState('1');
  const [repeatMonthly, setRepeatMonthly] = useState(true);
  const [category, setCategory] = useState('housing');
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Bill | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    const data = await getBills();
    setBills(data);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const openAdd = () => {
    haptics.light();
    setEditing(null);
    setName('');
    setAmount('');
    setDueDay('1');
    setRepeatMonthly(true);
    setCategory('housing');
    setShowModal(true);
  };

  const openEdit = (bill: Bill) => {
    haptics.light();
    setEditing(bill);
    setName(bill.name);
    setAmount(String(bill.amount));
    setDueDay(String(bill.dueDay));
    setRepeatMonthly(bill.repeatMonthly);
    setCategory(bill.category);
    setShowModal(true);
  };

  const handleSave = async () => {
    const trimmedName = name.trim();
    const amt = parseInt(amount, 10);
    const day = parseInt(dueDay, 10);

    if (!trimmedName) {
      Alert.alert('Name required', 'Give this bill a name, e.g. "Rent" or "Credit card".');
      return;
    }
    if (!Number.isFinite(amt) || amt <= 0) {
      Alert.alert('Amount required', 'Enter the bill amount in rupees.');
      return;
    }
    if (!Number.isFinite(day) || day < 1 || day > 31) {
      Alert.alert('Due day', 'Enter a due day between 1 and 31.');
      return;
    }

    setSaving(true);
    try {
      const granted = await ensureNotificationPermission();
      if (!granted) {
        Alert.alert(
          'Notifications off',
          'Reminders need notification permission. The bill is saved, but reminders won’t fire until you enable notifications in Settings.'
        );
      }

      const bill: Bill = {
        id: editing?.id ?? genId(),
        name: trimmedName,
        amount: amt,
        category,
        dueDay: day,
        repeatMonthly,
        // One-time bills resolve to the next occurrence of the chosen day.
        oneTimeDate: repeatMonthly ? undefined : toISODate(nextMonthlyOccurrence(day, new Date())),
        createdAt: editing?.createdAt ?? new Date().toISOString(),
      };

      await saveBill(bill);
      track(editing ? 'bill_updated' : 'bill_created', {
        repeat_monthly: repeatMonthly,
        has_permission: granted,
      });
      haptics.success();
      setShowModal(false);
      await load();
    } catch {
      haptics.error();
      Alert.alert('Could not save', 'Something went wrong saving this bill. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteBill(deleteTarget.id);
      track('bill_deleted', {});
      haptics.success();
      setDeleteTarget(null);
      await load();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <ScreenShell edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} accessibilityLabel="Go back">
          <Icon name="arrow-left" size={22} color={color.ink} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Bills & reminders</Text>
          <Text style={styles.headerSub}>Never miss rent, EMI or a bill</Text>
        </View>
        <TouchableOpacity onPress={openAdd} style={styles.addBtnHeader} accessibilityLabel="Add bill">
          <Icon name="plus" size={18} color={color.cream} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {loading ? (
          <LoadingSpinner />
        ) : bills.length === 0 ? (
          <EmptyState
            emoji="🔔"
            title="No bills yet"
            subtitle="Add a bill and Ari will remind you the day before and the day it's due — so nothing slips."
            actionLabel="Add your first bill"
            onAction={openAdd}
          />
        ) : (
          bills.map((bill, i) => (
            <AnimatedEntry key={bill.id} delay={60 + i * 60}>
              <View style={styles.card}>
                <View style={styles.cardIcon}>
                  <Icon name="bell" size={20} color={color.clay} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardName}>{bill.name}</Text>
                  <Text style={styles.cardMeta}>
                    ₹{bill.amount.toLocaleString('en-IN')} · due {nextDueLabel(bill)}
                    {bill.repeatMonthly ? ' · monthly' : ''}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => openEdit(bill)} style={styles.cardAction} accessibilityLabel={`Edit ${bill.name}`}>
                  <Icon name="edit" size={18} color={color.moss} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    haptics.warning();
                    setDeleteTarget(bill);
                  }}
                  style={styles.cardAction}
                  accessibilityLabel={`Delete ${bill.name}`}
                >
                  <Icon name="trash" size={18} color={color.clay} />
                </TouchableOpacity>
              </View>
            </AnimatedEntry>
          ))
        )}
      </ScrollView>

      {/* Add / edit bottom-sheet */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setShowModal(false)} />
          <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 24) + 8 }]}>
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>{editing ? 'Edit bill' : 'New bill'}</Text>

            <Input label="Name" placeholder="Rent, Credit card, Netflix…" value={name} onChangeText={setName} />
            <Input
              label="Amount (₹)"
              placeholder="0"
              value={amount}
              onChangeText={(t) => setAmount(t.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
            />
            <Input
              label="Due day of month (1–31)"
              placeholder="1"
              value={dueDay}
              onChangeText={(t) => setDueDay(t.replace(/[^0-9]/g, '').slice(0, 2))}
              keyboardType="number-pad"
            />

            <Text style={styles.fieldLabel}>Category</Text>
            <View style={styles.chips}>
              {BILL_CATEGORIES.map((c) => {
                const active = c.key === category;
                return (
                  <TouchableOpacity
                    key={c.key}
                    onPress={() => {
                      haptics.light();
                      setCategory(c.key);
                    }}
                    style={[styles.chip, active && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                      {c.emoji} {c.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.repeatRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.repeatTitle}>Repeat monthly</Text>
                <Text style={styles.repeatSub}>
                  {repeatMonthly ? 'Reminds you every month' : 'One-time reminder only'}
                </Text>
              </View>
              <Switch
                value={repeatMonthly}
                onValueChange={(v) => {
                  haptics.light();
                  setRepeatMonthly(v);
                }}
                trackColor={{ false: color.line, true: color.forest }}
                thumbColor={color.cream}
              />
            </View>

            <Button onPress={handleSave} loading={saving} fullWidth>
              {editing ? 'Save changes' : 'Add bill'}
            </Button>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <DeleteConfirmSheet
        visible={!!deleteTarget}
        title="Delete bill?"
        message={`This removes "${deleteTarget?.name}" and cancels its reminders.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderColor: color.line,
    backgroundColor: color.card,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: typeScale.screenTitle, fontFamily: font.bodySemi, color: color.ink },
  headerSub: { fontSize: typeScale.caption, fontFamily: font.body, color: color.inkSoft, marginTop: 2 },
  addBtnHeader: {
    backgroundColor: color.forest,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: color.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: color.line,
    padding: 14,
    marginBottom: 12,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: color.clayTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardName: { fontSize: 15, fontFamily: font.bodySemi, color: color.ink },
  cardMeta: { fontSize: typeScale.caption, fontFamily: font.body, color: color.inkSoft, marginTop: 2 },
  cardAction: { padding: 6 },

  overlay: { flex: 1, backgroundColor: 'rgba(3,18,18,0.45)' },
  sheet: {
    backgroundColor: color.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    borderTopWidth: 1,
    borderColor: color.line,
    maxHeight: '92%',
  },
  handle: { width: 40, height: 4, backgroundColor: color.line, borderRadius: 2, alignSelf: 'center', marginBottom: 18 },
  sheetTitle: { fontSize: 18, fontFamily: font.displaySemi, color: color.forestDeep, marginBottom: 14 },
  fieldLabel: { fontSize: typeScale.caption, fontFamily: font.bodyMed, color: color.inkSoft, marginBottom: 8, marginTop: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: color.line,
    backgroundColor: color.cream2,
  },
  chipActive: { backgroundColor: color.forest, borderColor: color.forest },
  chipText: { fontSize: 12.5, fontFamily: font.bodyMed, color: color.inkSoft },
  chipTextActive: { color: color.cream },
  repeatRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  repeatTitle: { fontSize: 14, fontFamily: font.bodySemi, color: color.ink },
  repeatSub: { fontSize: typeScale.caption, fontFamily: font.body, color: color.inkSoft, marginTop: 2 },
});
