import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert,
  ActivityIndicator, Linking, Share,
} from 'react-native';
import ScreenShell from '../components/ScreenShell';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import Icon from '../components/ui/Icon';
import { color, font } from '../theme/tokens';
import { useHaptics } from '../hooks/useHaptics';
import { useLocale } from '../hooks/useLocale';
import { usePrivacy } from '../context/PrivacyContext';
import { useAuth } from '../context/AuthContext';
import {
  getGroupDetail, listSharedExpenses, getBalances, createInvite,
  settleSplit, confirmUpiSettlement, confirmGroupCurrency,
  type GroupDetail, type SharedExpense, type BalancesResponse,
} from '../api/groups';
import type { MainStackParamList } from '../navigation/navigationTypes';
import { useLanguage } from '../i18n/LanguageContext';
import { groupCopy } from '../i18n/groupFlowCopy';
import { formatGroupAmount } from '../utils/groupCurrency';

type Nav = StackNavigationProp<MainStackParamList>;
type Rt = RouteProp<MainStackParamList, 'GroupDetail'>;

export default function GroupDetailScreen() {
  const { language } = useLanguage();
  const c = (text: string, values?: Record<string, string | number>) => groupCopy(language, text, values);
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Rt>();
  const haptics = useHaptics();
  const { isPrivate } = usePrivacy();
  const { user } = useAuth();
  const { formatDate } = useLocale();
  const scope = user?.id ? `${user.id}:${params.groupId}` : undefined;
  const account = useRef(scope);
  account.current = scope;
  const revision = useRef(0);
  const busy = useRef(false);
  const owner = useRef<string | undefined>(undefined);
  const [loadError, setLoadError] = useState(false);

  const [group, setGroup] = useState<GroupDetail | null>(null);
  const formatAmount = (amount: number) => formatGroupAmount(amount, group?.currency ?? null, language, isPrivate);
  const [expenses, setExpenses] = useState<SharedExpense[]>([]);
  const [balances, setBalances] = useState<BalancesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [settling, setSettling] = useState<string | null>(null);
  useEffect(() => {
    account.current = scope; busy.current = false; setSettling(null);
    return () => { account.current = undefined; revision.current += 1; };
  }, [scope]);

  const load = useCallback(async () => {
    const uid = scope;
    const requestRevision = ++revision.current;
    setLoading(true);
    setLoadError(false);
    if (owner.current !== uid) { setGroup(null); setExpenses([]); setBalances(null); }
    try {
      const [g, e, b] = await Promise.all([
        getGroupDetail(params.groupId),
        listSharedExpenses(params.groupId),
        getBalances(params.groupId),
      ]);
      if (account.current !== uid || requestRevision !== revision.current) return;
      owner.current = uid;
      setGroup(g);
      setExpenses(e.expenses);
      setBalances(b);
    } catch {
      if (account.current === uid && requestRevision === revision.current) setLoadError(true);
    } finally {
      if (account.current === uid && requestRevision === revision.current) setLoading(false);
    }
  }, [params.groupId, scope]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleInvite = async () => {
    haptics.light();
    const uid = account.current;
    try {
      const inv = await createInvite(params.groupId);
      if (account.current !== uid) return;
      await Share.share({
        message: c('Join my Ari group "{name}" with code {code} (expires in 7 days).', {name: group?.name ?? '', code: inv.code}),
        title: c('Ari group invite'),
      });
    } catch {
      if (account.current === uid) Alert.alert(c('Could not create invite'), c('Check your connection and retry.'));
    }
  };

  const settlementError = () => Alert.alert(c('Could not record settlement'),
    c('The result is unconfirmed. Refresh the group before paying again. No cash payment has been assumed.'),
    [{ text: c('Retry'), onPress: () => { void load(); } }, { text: c('Cancel'), style: 'cancel' }]);

  const confirmPaid = async (splitId: string, uid: string) => {
    if (account.current !== uid || busy.current || !group?.currency) return;
    busy.current = true; setSettling(splitId);
    try {
      const result = await confirmUpiSettlement(params.groupId, splitId, group.currency);
      if (account.current !== uid) return;
      if (result.settled !== true) throw new Error('Unconfirmed');
      haptics.success(); void load();
    } catch { if (account.current === uid) settlementError(); }
    finally { if (account.current === uid) { busy.current = false; setSettling(null); } }
  };
  const handleSettle = async (splitId: string, method: 'upi' | 'cash') => {
    const uid = account.current;
    if (!uid || busy.current || !group?.currency) return;
    busy.current = true; setSettling(splitId);
    try {
      const result = await settleSplit(params.groupId, splitId, method, group.currency);
      if (account.current !== uid) return;
      if (result.settled === true) { haptics.success(); void load(); return; }
      if (method !== 'upi' || !result.upiLink || !result.upiLink.startsWith('upi://pay?')) throw new Error('Unconfirmed');
      if (!await Linking.canOpenURL(result.upiLink)) {
        if (account.current === uid) Alert.alert(c('No UPI app available'), c('Open your payment app directly and check its status.'));
        return;
      }
      if (account.current !== uid) return;
      await Linking.openURL(result.upiLink);
      if (account.current !== uid) return;
      Alert.alert(c('Record your payment?'), c('Only confirm after checking the completed transfer in your payment app. Ari does not verify the bank transfer.'), [
        { text: c('Not yet'), style: 'cancel' },
        { text: c('I checked and paid'), onPress: () => { void confirmPaid(splitId, uid); } },
      ]);
    } catch { if (account.current === uid) settlementError(); }
    finally { if (account.current === uid) { busy.current = false; setSettling(null); } }
  };
  const recordCash = (splitId: string) => {
    const uid = account.current;
    Alert.alert(c('Record cash already paid?'), c('This only records cash you already paid. It does not transfer money.'), [
      { text: c('Cancel'), style: 'cancel' },
      { text: c('Record cash'), onPress: () => { if (account.current === uid) void handleSettle(splitId, 'cash'); } },
    ]);
  };

  const chooseCurrency = (currency: string) => {
    const uid = account.current;
    Alert.alert(c('Confirm {currency} for existing amounts?', {currency}),
      c('Only confirm after checking the original records with your group. This labels existing amounts; it does not convert them. This cannot be changed later.'), [
        {text: c('Cancel'), style: 'cancel'},
        {text: c('Confirm currency'), onPress: async () => {
          if (account.current !== uid || busy.current) return;
          busy.current = true; setSettling('currency');
          try {
            const result = await confirmGroupCurrency(params.groupId, currency);
            if (account.current !== uid) return;
            if (result.currency !== currency || result.amountsConverted !== false) throw new Error('Unconfirmed');
            void load();
          } catch { if (account.current === uid) Alert.alert(c('Could not confirm currency'), c('Check your connection and retry.')); }
          finally { if (account.current === uid) { busy.current = false; setSettling(null); } }
        }},
      ]);
  };

  if (loadError) return <ScreenShell edges={['top']}><Text>{c('Could not load group')}</Text><TouchableOpacity accessibilityRole="button" onPress={() => { void load(); }}><Text>{c('Retry')}</Text></TouchableOpacity><TouchableOpacity onPress={() => navigation.goBack()}><Text>{c('Back')}</Text></TouchableOpacity></ScreenShell>;
  if (loading || !group || owner.current !== scope) {
    return (
      <ScreenShell edges={['top']}>
        <ActivityIndicator color={color.forest} style={{ marginTop: 40 }} />
      </ScreenShell>
    );
  }

  const memberMap = Object.fromEntries(group.members.map((m) => [m.id, m]));
  const myNet = balances?.nets.find((n) => n.user.id === user?.id)?.net ?? 0;
  const owedToMe = balances?.pairs.filter((p) => p.creditor.id === user?.id) ?? [];
  const iOwe = balances?.pairs.filter((p) => p.debtor.id === user?.id) ?? [];

  return (
    <ScreenShell edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8}>
          <Icon name="arrow-left" size={22} color={color.ink} />
        </TouchableOpacity>
        <Text style={styles.title}>{group.name}</Text>
        <TouchableOpacity onPress={handleInvite} hitSlop={8}>
          <Icon name="share" size={20} color={color.forest} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text>{group.currency ? c('Recorded currency: {currency}', {currency: group.currency}) : c('Recorded currency unknown')}</Text>
        {!group.currency && <View>
          <Text>{c('The group creator must confirm the original currency before adding expenses or recording payments.')}</Text>
          {group.createdBy === user?.id && <View><Text>{c('Confirm recorded currency')}</Text>
            {['INR', 'USD', 'GBP', 'AUD'].map(currency => <TouchableOpacity key={currency} accessibilityRole="button" disabled={settling !== null} onPress={() => chooseCurrency(currency)}><Text>{currency}</Text></TouchableOpacity>)}
          </View>}
        </View>}
        {group.currency && group.currency !== 'INR' && <Text>{c('UPI is available only for INR groups.')}</Text>}
        {/* Net balance summary */}
        <View style={[styles.summaryCard, myNet > 0 ? styles.summaryPositive : myNet < 0 ? styles.summaryNegative : null]}>
          <Text style={styles.summaryLabel}>{c('Your net balance')}</Text>
          <Text style={styles.summaryAmount}>
            {myNet >= 0 ? '+' : '-'}{formatAmount(Math.abs(myNet))}
          </Text>
          <Text style={styles.summarySub}>
            {myNet > 0 ? c('You are owed money') : myNet < 0 ? c('You owe money') : c('All settled up')}
          </Text>
        </View>

        {/* Pairs you owe — actionable */}
        {iOwe.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{c('You owe')}</Text>
            <Text>{c('Record individual expense payments below. Net balances may offset several expenses.')}</Text>
            {iOwe.map((p) => <View key={`${p.debtor.id}-${p.creditor.id}`} style={styles.pairRow}><Text style={styles.pairText}>{p.creditor.name} • {formatAmount(p.amount)}</Text></View>)}
          </View>
        )}

        {owedToMe.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{c('Owed to you')}</Text>
            {owedToMe.map((p) => (
              <View key={`${p.debtor.id}-${p.creditor.id}`} style={styles.pairRow}>
                <Text style={styles.pairText}>
                  {p.debtor.name} • {formatAmount(p.amount)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Add expense */}
        <TouchableOpacity
          style={styles.addExpenseBtn}
          disabled={!group.currency}
          onPress={() => navigation.navigate('AddSharedExpense', { groupId: params.groupId })}
        >
          <Icon name="plus" size={16} color={color.cream} />
          <Text style={styles.addExpenseText}>{c('Add shared expense')}</Text>
        </TouchableOpacity>

        {/* Expense list */}
        <Text style={styles.sectionLabel}>{c('Recent expenses')}</Text>
        {expenses.length === 0 ? (
          <Text style={styles.empty}>{c('No shared expenses yet.')}</Text>
        ) : (
          expenses.map((e) => {
            const payerName = memberMap[e.paidBy]?.name ?? c('Someone');
            const myUnsettledSplit = e.splits.find(
              (s) => s.owedBy === user?.id && !s.settledAt,
            );
            return (
              <View key={e.id} style={styles.expenseCard}>
                <View style={styles.expenseTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.expenseDesc}>{e.description || c('Shared expense')}</Text>
                    <Text style={styles.expenseSub}>
                      {c('{name} paid', {name: payerName})} • {formatDate(new Date(e.date + 'T00:00:00'), { day: 'numeric', month: 'short' })}
                    </Text>
                  </View>
                  <Text style={styles.expenseAmount}>{formatAmount(e.amount)}</Text>
                </View>

                {myUnsettledSplit && (
                  <View style={styles.settleRow}>
                    <Text style={styles.youOwe}>
                      {c('You owe {amount}', {amount: formatAmount(myUnsettledSplit.amount)})}
                    </Text>
                    <TouchableOpacity
                      style={styles.settleBtn}
                      disabled={settling !== null || group.currency !== 'INR'}
                      onPress={() => handleSettle(myUnsettledSplit.id, 'upi')}
                    >
                      <Text style={styles.settleText}>
                        {c(settling === myUnsettledSplit.id ? 'Opening UPI…' : 'Settle via UPI')}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity accessibilityRole="button" disabled={settling !== null || !group.currency} onPress={() => recordCash(myUnsettledSplit.id)}><Text>{c('Record cash')}</Text></TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderColor: color.line,
  },
  title: { fontSize: 17, fontFamily: font.displayBold, color: color.ink, flex: 1, textAlign: 'center' },
  scroll: { padding: 20, paddingBottom: 40 },
  summaryCard: {
    padding: 18, borderRadius: 14, alignItems: 'center',
    backgroundColor: color.card, borderWidth: 1, borderColor: color.line,
    marginBottom: 16,
  },
  summaryPositive: { borderColor: color.forest, backgroundColor: color.cream2 },
  summaryNegative: { borderColor: color.clay, backgroundColor: color.clayTint },
  summaryLabel: { fontSize: 12, color: color.inkSoft, marginBottom: 4 },
  summaryAmount: { fontSize: 28, fontFamily: font.displayBold, color: color.ink },
  summarySub: { fontSize: 12, color: color.inkSoft, marginTop: 4 },
  section: { marginBottom: 16 },
  sectionLabel: {
    fontSize: 11, color: color.inkFaint, fontFamily: font.bodySemi,
    letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8, marginTop: 8,
  },
  pairRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10,
    paddingVertical: 8, paddingHorizontal: 12,
    backgroundColor: color.card, borderRadius: 10,
    borderWidth: 1, borderColor: color.line, marginBottom: 6,
  },
  pairText: { flex: 1, fontSize: 13, color: color.ink, fontFamily: font.bodyMed },
  settleNowBtn: {
    paddingHorizontal: 14, minHeight: 44, justifyContent: 'center', borderRadius: 8,
    backgroundColor: color.forest,
  },
  settleNowText: { fontSize: 12.5, fontFamily: font.bodySemi, color: color.cream },
  addExpenseBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: color.forest, paddingVertical: 14, borderRadius: 12,
    marginBottom: 20, marginTop: 6,
  },
  addExpenseText: { color: color.cream, fontSize: 14, fontFamily: font.bodySemi },
  expenseCard: {
    backgroundColor: color.card, borderRadius: 12,
    borderWidth: 1, borderColor: color.line,
    padding: 14, marginBottom: 10,
  },
  expenseTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  expenseDesc: { fontSize: 14, fontFamily: font.bodySemi, color: color.ink },
  expenseSub: { fontSize: 12, color: color.inkSoft, marginTop: 2 },
  expenseAmount: { fontSize: 16, fontFamily: font.displayBold, color: color.ink },
  settleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 12, paddingTop: 10,
    borderTopWidth: 1, borderTopColor: color.line,
  },
  youOwe: { fontSize: 12, color: color.clay, fontFamily: font.bodySemi },
  settleBtn: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8,
    backgroundColor: color.cream2, borderWidth: 1, borderColor: color.forest,
  },
  settleText: { fontSize: 12, fontFamily: font.bodySemi, color: color.forest },
  empty: { fontSize: 13, color: color.inkFaint, textAlign: 'center', marginTop: 16 },
});
