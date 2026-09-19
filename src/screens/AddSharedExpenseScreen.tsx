import {useLanguage} from '../i18n/LanguageContext';
import {groupCopy} from '../i18n/groupFlowCopy';
import { randomUUID } from 'expo-crypto';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import ScreenShell from '../components/ScreenShell';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import Button from '../components/ui/Button';
import Icon from '../components/ui/Icon';
import ErrorBanner from '../components/ui/ErrorBanner';
import { color, font } from '../theme/tokens';
import { useHaptics } from '../hooks/useHaptics';
import { useAuth } from '../context/AuthContext';
import { getGroupDetail, logSharedExpense, type GroupDetail } from '../api/groups';
import { todayISO } from '../utils/dateHelpers';
import type { MainStackParamList } from '../navigation/navigationTypes';

type Nav = StackNavigationProp<MainStackParamList>;
type Rt = RouteProp<MainStackParamList, 'AddSharedExpense'>;

export default function AddSharedExpenseScreen() {
 const {language}=useLanguage();
 const c = (text: string, values?: Record<string, string | number>) => groupCopy(language, text, values);
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Rt>();
  const haptics = useHaptics();
  const { user } = useAuth();

  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  // Feature-flag gated; both vars intentionally unused until group splitting ships.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_splitType, _setSplitType] = useState<'equal' | 'me_only'>('equal');
  // selected = members included in the equal split
  const [included, setIncluded] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [loadError, setLoadError] = useState(false);
  const [locked, setLocked] = useState(false);
  const busy = useRef(false);
  const scope = user?.id ? `${user.id}:${params.groupId}` : undefined;
  const account = useRef(scope);
  account.current = scope;
  const revision = useRef(0);
  const owner = useRef<string | undefined>(undefined);
  const pending = useRef<Parameters<typeof logSharedExpense>[1] | null>(null);

  useEffect(() => {
    account.current = scope; busy.current = false; setSaving(false);
    return () => { account.current = undefined; revision.current += 1; };
  }, [scope]);

  const load = useCallback(async () => {
    const uid = scope;
    const requestRevision = ++revision.current;
    setLoadError(false);
    if (owner.current !== uid) {
      setGroup(null); setAmount(''); setDescription(''); setIncluded(new Set());
      pending.current = null; setLocked(false); setError('');
    }
    try {
      const g = await getGroupDetail(params.groupId);
      if (account.current !== uid || requestRevision !== revision.current) return;
      owner.current = uid; setGroup(g);
      if (!pending.current) setIncluded(new Set(g.members.map((m) => m.id)));
    } catch { if (account.current === uid && requestRevision === revision.current) setLoadError(true); }
  }, [params.groupId, scope]);

  useEffect(() => { void load(); }, [load]);

  const toggleIncluded = (uid: string) => {
    haptics.light();
    setIncluded((prev) => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid); else next.add(uid);
      return next;
    });
  };

  const handleSave = async () => {
    if (!user || !group?.currency || busy.current) return;
    const uid = account.current;
    setError('');
    const amt = Number(amount);
    if (!/^\d+(\.\d{1,2})?$/.test(amount) || !Number.isFinite(amt) || amt <= 0 || amt > 10_000_000) {
      setError(c('Enter a valid amount'));
      return;
    }
    if (included.size === 0) {
      setError(c('Pick at least one person to split with'));
      return;
    }
    if (!description.trim()) {
      setError(c('Add a short description'));
      return;
    }

    // Equal split with paisa-correct rounding so the splits sum exactly.
    const ids = [...included];
    const each = Math.floor((amt / ids.length) * 100) / 100;
    const remainder = Math.round((amt - each * ids.length) * 100); // in paise
    const splits = ids.map((id, idx) => ({
      userId: id,
      // Distribute the residual paise to the first `remainder` users
      amount: (each + (idx < remainder ? 0.01 : 0)).toFixed(2),
    }));

    busy.current = true; setSaving(true);
    try {
      if (!pending.current) pending.current = {
        id: randomUUID(),
        currency: group.currency,
        amount: amt,
        description: description.trim(),
        category: 'other',
        date: todayISO(),
        splits,
      };
      setLocked(true);
      const result = await logSharedExpense(params.groupId, pending.current);
      if (account.current !== uid) return;
      if (result.id !== pending.current.id) throw new Error('Unconfirmed');
      haptics.success();
      navigation.goBack();
    } catch {
      if (account.current !== uid) return;
      haptics.error();
      setError(c('Save is unconfirmed. Your draft is kept. Retry the same draft safely, or go back to check the group.'));
    } finally {
      if (account.current === uid) { busy.current = false; setSaving(false); }
    }
  };

  if (loadError) return <ScreenShell edges={['top']}><Text>{c('Could not load group')}</Text><TouchableOpacity accessibilityRole="button" onPress={() => { void load(); }}><Text>{c('Retry')}</Text></TouchableOpacity><TouchableOpacity onPress={() => navigation.goBack()}><Text>{c('Back')}</Text></TouchableOpacity></ScreenShell>;
  if (!group || owner.current !== scope) {
    return (
      <ScreenShell edges={['top']}>
        <ActivityIndicator color={color.forest} style={{ marginTop: 40 }} />
      </ScreenShell>
    );
  }

  if (!group.currency) return <ScreenShell edges={['top']}><Text>{c('Recorded currency unknown')}</Text><Text>{c('The group creator must confirm the original currency before adding expenses or recording payments.')}</Text><TouchableOpacity onPress={() => navigation.goBack()}><Text>{c('Back')}</Text></TouchableOpacity></ScreenShell>;
  return (
    <ScreenShell edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.cancel}>{c("Cancel")}</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{c('Add to {name}', {name: group.name})}</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <ErrorBanner message={error} />

          <View style={styles.amountRow}>
            <Text style={styles.rupee}>{group.currency} </Text>
            <TextInput
              style={styles.amount}
              accessibilityLabel={c('Amount')}
              editable={!locked}
              value={amount}
              onChangeText={setAmount}
              placeholder="0"
              placeholderTextColor={color.inkFaint}
              keyboardType="numeric"
              returnKeyType="next"
            />
          </View>

          <Text style={styles.label}>{c('What was it for?')}</Text>
          <TextInput
            style={styles.input}
            accessibilityLabel={c('Description')}
            editable={!locked}
            maxLength={500}
            value={description}
            onChangeText={setDescription}
            placeholder={c('Hotel, dinner, cab…')}
            placeholderTextColor={color.inkFaint}
          />

          <Text style={styles.label}>{c('Split equally between')}</Text>
          {group.members.map((m) => {
            const checked = included.has(m.id);
            const isYou = m.id === user?.id;
            return (
              <TouchableOpacity
                key={m.id}
                style={styles.memberRow}
                activeOpacity={0.8}
                accessibilityRole="checkbox"
                accessibilityState={{checked, disabled: locked}}
                disabled={locked}
                onPress={() => toggleIncluded(m.id)}
              >
                <View style={[styles.checkbox, checked && styles.checkboxOn]}>
                  {checked && <Icon name="check-circle" size={14} color={color.cream} />}
                </View>
                <Text style={styles.memberName}>
                  {m.name}{isYou ? c(' (you)') : ''}
                </Text>
                {checked && amount && parseFloat(amount) > 0 && (
                  <Text style={styles.share}>
                    {group.currency} {((Math.floor(Math.round(Number(amount) * 100) / included.size) + ([...included].indexOf(m.id) < Math.round(Number(amount) * 100) % included.size ? 1 : 0)) / 100).toFixed(2)}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}

          <Button onPress={handleSave} loading={saving} fullWidth style={{ marginTop: 24 }}>
            {c(locked ? "Retry" : "Save")}</Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: color.cream },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderColor: color.line,
  },
  cancel: { fontSize: 15, color: color.inkSoft },
  title: { fontSize: 16, fontFamily: font.displayBold, color: color.ink, flex: 1, textAlign: 'center' },
  scroll: { padding: 20, paddingBottom: 40 },
  amountRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginVertical: 8,
  },
  rupee: { fontSize: 36, color: color.inkFaint, fontFamily: font.displayBold },
  amount: {
    fontSize: 48, fontFamily: font.displayBold, color: color.ink,
    minWidth: 100, textAlign: 'center',
  },
  label: {
    fontSize: 12, color: color.inkSoft, fontFamily: font.bodySemi,
    marginTop: 16, marginBottom: 8,
  },
  input: {
    backgroundColor: color.cream2, borderRadius: 10,
    borderWidth: 1, borderColor: color.line,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: color.ink,
  },
  memberRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, paddingHorizontal: 12,
    backgroundColor: color.card, borderRadius: 10,
    borderWidth: 1, borderColor: color.line, marginBottom: 6,
  },
  checkbox: {
    width: 22, height: 22, borderRadius: 6,
    borderWidth: 2, borderColor: color.line,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxOn: { backgroundColor: color.forest, borderColor: color.forest },
  memberName: { flex: 1, fontSize: 14, color: color.ink, fontFamily: font.bodyMed },
  share: { fontSize: 13, color: color.inkSoft, fontFamily: font.bodySemi },
});
