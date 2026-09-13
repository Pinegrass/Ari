import React, { useMemo, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenShell, { bottomPad as shellPad } from '../components/ScreenShell';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import BalanceCard from '../components/BalanceCard';
import Icon from '../components/ui/Icon';
import NudgeCard from '../components/NudgeCard';
import TransactionItem from '../components/TransactionItem';
import { SkeletonList } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import { font, type } from '../theme/tokens';
import { useColors } from '../context/ThemeContext';
import type { Palette } from '../theme/palettes';
import { todayISO } from '../utils/dateHelpers';
import { useHaptics } from '../hooks/useHaptics';
import { useLocale } from '../hooks/useLocale';
import type { TabParamList, MainStackParamList } from '../navigation/navigationTypes';
import { track } from '../lib/analytics';
import { usePrivacy } from '../context/PrivacyContext';
import { useLanguage } from '../i18n/LanguageContext';

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Dashboard'>,
  StackNavigationProp<MainStackParamList>
>;

function getGreetingKey() {
  const hour = new Date().getHours();
  return hour < 12 ? 'homeMorning' : hour < 17 ? 'homeAfternoon' : 'homeEvening';
}

/** Daily Home: one summary, one optional nudge, recent entries and deeper review links. */
export default function DashboardScreen() {
  const {t, language} = useLanguage();
  const { isPrivate, togglePrivate } = usePrivacy();
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();
  const { locale } = useLocale();
  const insets = useSafeAreaInsets();
  const {
    transactions,
    summary,
    nudge,
    loadingData,
    refreshing,
    fetchAll,
    fetchNudge,
    dismissNudge,
    refresh,
  } = useData();
  const haptics = useHaptics();
  const c = useColors();
  const styles = useMemo(() => makeStyles(c), [c]);
  const presentedNudges = useRef(new Set<string>());

  useEffect(() => {
    if (isPrivate || !nudge || presentedNudges.current.has(nudge.id)) return;
    presentedNudges.current.add(nudge.id);
    track('nudge_presented', {
      nudge_id: nudge.id,
      trigger: nudge.trigger,
      experiment_variant: nudge.experimentVariant,
      surface: 'dashboard',
    });
  }, [nudge, isPrivate]);

  useFocusEffect(
    useCallback(() => {
      fetchAll();
      // Nudge has its own 30-min cache TTL inside fetchWithCache, so asking
      // on every focus is cheap and keeps the card fresh after new entries.
      fetchNudge();
    }, [fetchAll, fetchNudge])
  );

  const today = todayISO();
  const moneyOut = useMemo(() => transactions.reduce(
    (total, transaction) => total + (transaction.date === today && transaction.type === 'expense' ? transaction.amount : 0), 0,
  ), [transactions, today]);
  const recentTxns = useMemo(() => transactions.slice(0, 3), [transactions]);
  const dateLabel = new Date().toLocaleDateString(language === 'hi' ? 'hi-IN' : locale.localeTag, {
    weekday: 'short', day: 'numeric', month: 'short',
  });

  const handleAddEntry = useCallback(() => {
    haptics.medium();
    navigation.navigate('AddTransaction', { type: 'expense' });
  }, [haptics, navigation]);

  const handleSeeAll = useCallback(() => {
    navigation.navigate('Tabs', { screen: 'Transactions' });
  }, [navigation]);

  const handleNudgePress = useCallback(() => {
    if (!nudge) return;
    haptics.light();
    track('nudge_opened', {
      nudge_id: nudge.id,
      trigger: nudge.trigger,
      experiment_variant: nudge.experimentVariant,
      surface: 'dashboard',
    });
    navigation.navigate('Tabs', {
      screen: 'Tomo',
      params: {
        prompt: nudge.actionPrompt,
        nudgeId: nudge.id,
        nudgeTrigger: nudge.trigger,
        experimentVariant: nudge.experimentVariant,
      },
    });
  }, [haptics, navigation, nudge]);

  const handleNudgeDismiss = useCallback(() => {
    if (!nudge) return;
    haptics.light();
    track('nudge_dismissed', {
      nudge_id: nudge.id,
      trigger: nudge.trigger,
      experiment_variant: nudge.experimentVariant,
      surface: 'dashboard',
    });
    void dismissNudge(nudge);
  }, [dismissNudge, haptics, nudge]);

  const bottom = shellPad.tab(insets);

  return (
    <ScreenShell
      edges={['top']}
      scrollable
      bottomPad={bottom}
      contentContainerStyle={styles.container}
      backgroundColor={c.cream}
      scrollViewProps={{
        showsVerticalScrollIndicator: false,
        refreshControl: (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={c.forest}
            colors={[c.forest]}
          />
        ),
      }}
    >
      <View style={styles.header}>
        <View style={styles.greetingBlock}>
          <Text style={styles.eyebrow}>{dateLabel}</Text>
          <Text style={styles.greet}>{t(getGreetingKey(), { name: user?.name?.split(' ')[0] || t('homeFriend') })}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconButton} accessibilityRole="button"
            accessibilityLabel={t(isPrivate ? 'homeShowAmounts' : 'homeHideAmounts')}
            onPress={togglePrivate}>
            <Icon name={isPrivate ? 'eye-off' : 'eye'} size={21} color={c.forest} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} accessibilityRole="button"
            accessibilityLabel={t('updates')} onPress={() => navigation.navigate('NudgeInbox')}>
            <Icon name="bell" size={21} color={c.forest} />
          </TouchableOpacity>
        </View>
      </View>

      <BalanceCard spentToday={moneyOut} spentThisMonth={summary?.expenses ?? null}
        loading={loadingData && transactions.length === 0}
        onPlan={() => navigation.navigate('Planning')} />

      {nudge && !isPrivate && (
        <NudgeCard compact nudge={nudge} onPress={handleNudgePress} onDismiss={handleNudgeDismiss} />
      )}

      <View style={styles.secHead}>
        <Text style={styles.secTitle}>{t('homeRecent')}</Text>
        <TouchableOpacity onPress={handleSeeAll} style={styles.textLink}
          accessibilityLabel={t('homeAllTransactions')} accessibilityRole="link">
          <Text style={styles.seeAll}>{t('homeViewAll')} →</Text>
        </TouchableOpacity>
      </View>
      {loadingData && recentTxns.length === 0 ? (
        <SkeletonList count={3} />
      ) : recentTxns.length === 0 ? (
        <EmptyState emoji="💳" title={t('homeNoEntries')} subtitle={t('homeFirstEntryHelp')}
          actionLabel={t('homeAddEntry')} onAction={handleAddEntry} />
      ) : recentTxns.map((txn, i) => (
        <TransactionItem key={txn.id} transaction={txn} showDelete={false} testID={`txn-row-${i}`}
          onEdit={(transaction) => navigation.navigate('AddTransaction', {
            editTransaction: { id: transaction.id, type: transaction.type, amount: transaction.amount,
              category: transaction.category, description: transaction.description,
              note: transaction.note, date: transaction.date },
          })} />
      ))}

      <TouchableOpacity style={styles.reviewLink} accessibilityRole="button"
        onPress={() => navigation.navigate('PeriodicReports')}>
        <View style={styles.greetingBlock}>
          <Text style={styles.reviewTitle}>{t('reports')}</Text>
          <Text style={styles.reviewHelp}>{t('homeReviewHelp')}</Text>
        </View>
        <Icon name="chevron-right" size={20} color={c.forest} />
      </TouchableOpacity>
    </ScreenShell>
  );
}

const makeStyles = (c: Palette) => StyleSheet.create({
  container: { paddingHorizontal: 22, paddingTop: 8 },
  eyebrow: {
    fontFamily: font.bodyBold,
    fontSize: type.eyebrow,
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    color: c.moss,
  },
  greet: {
    fontFamily: font.display,
    fontSize: 25,
    letterSpacing: -0.3,
    marginTop: 5,
    color: c.forestDeep,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  greetingBlock: { flex: 1, minWidth: 0 },
  headerActions: { flexDirection: 'row' },
  iconButton: { width: 44, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  textLink: { minHeight: 44, justifyContent: 'center' },
  reviewLink: { flexDirection: 'row', alignItems: 'center', gap: 12, borderTopWidth: 1,
    borderTopColor: c.line, marginTop: 24, paddingVertical: 20 },
  reviewTitle: { fontFamily: font.bodySemi, fontSize: 16, color: c.forest },
  reviewHelp: { fontFamily: font.body, fontSize: 13, color: c.inkSoft, marginTop: 4 },
  secHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 10,
    marginBottom: 10,
    marginHorizontal: 2,
  },
  secTitle: {
    fontFamily: font.displaySemi,
    fontSize: type.sectionHead,
    color: c.forestDeep,
  },
  seeAll: {
    fontFamily: font.bodySemi,
    fontSize: 14,
    color: c.moss,
  },
});
