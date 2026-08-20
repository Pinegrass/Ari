import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';

import ScreenShell from '../components/ScreenShell';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import Icon from '../components/ui/Icon';
import { useHaptics } from '../hooks/useHaptics';
import { useColors } from '../context/ThemeContext';
import { getAaConsent, syncAaConsent, type AaConsentDetail } from '../api/aa';
import type { MainStackParamList } from '../navigation/navigationTypes';

export default function LinkBankConsentDetailScreen() {
  const route = useRoute<RouteProp<MainStackParamList, 'LinkBankConsentDetail'>>();
  const navigation = useNavigation<StackNavigationProp<MainStackParamList>>();
  const haptics = useHaptics();
  const c = useColors();

  const { consentHandle } = route.params;
  const [detail, setDetail] = useState<AaConsentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    try {
      setDetail(await getAaConsent(consentHandle));
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [consentHandle]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const onSync = async () => {
    setSyncing(true);
    try {
      const result = await syncAaConsent(consentHandle);
      const imported = result.imported ?? 0;
      const duplicates = result.duplicates ?? 0;
      Alert.alert(
        'Sync complete',
        imported > 0
          ? `Imported ${imported} transaction${imported === 1 ? '' : 's'}${duplicates ? ` (${duplicates} already tracked)` : ''}.`
          : 'No new transactions found.',
      );
      await load();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sync failed. Please try again.';
      Alert.alert('Sync failed', message);
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <ScreenShell edges={['top', 'bottom']} backgroundColor={c.cream}>
        <LoadingSpinner message="Loading bank link…" fullScreen />
      </ScreenShell>
    );
  }

  if (error || !detail) {
    return (
      <ScreenShell edges={['top', 'bottom']} backgroundColor={c.cream}>
        <EmptyState
          emoji="📡"
          title="Couldn't load this bank link"
          subtitle="Check your connection and try again."
          actionLabel="Retry"
          onAction={() => {
            setLoading(true);
            void load();
          }}
        />
      </ScreenShell>
    );
  }

  const active = detail.status === 'ACTIVE';

  return (
    <ScreenShell edges={['top', 'bottom']} backgroundColor={c.cream}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <TouchableOpacity
          onPress={() => {
            haptics.light();
            navigation.goBack();
          }}
          style={styles.backRow}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Icon name="arrow-left" size={22} color={c.inkSoft} />
          <Text style={[styles.backText, { color: c.inkSoft }]}>Linked accounts</Text>
        </TouchableOpacity>

        <View style={[styles.card, { backgroundColor: c.card, borderColor: c.line }]}>
          <View style={styles.cardHead}>
            <Icon name={active ? 'check-circle' : 'clock'} size={26} color={active ? c.forest : c.inkSoft} />
            <Text style={[styles.cardTitle, { color: c.ink }]}>
              {active ? 'Linked & syncing' : 'Not active yet'}
            </Text>
          </View>
          <Text style={[styles.cardMeta, { color: c.inkSoft }]}>
            Status: {detail.status}
          </Text>
          <Text style={[styles.cardMeta, { color: c.inkSoft }]}>
            Accounts: {detail.fiTypes?.join(', ') || 'Deposit'}
          </Text>
        </View>

        {active ? (
          <Button
            onPress={() => void onSync()}
            loading={syncing}
            fullWidth
            style={styles.cta}
            accessibilityLabel="Sync latest transactions"
          >
            Sync latest transactions
          </Button>
        ) : (
          <Text style={[styles.pendingHint, { color: c.inkSoft }]}>
            {detail.status === 'PENDING'
              ? 'Your bank approval is still in progress. Open the approval link from the previous step, or start a fresh link.'
              : 'This consent is no longer active. Start a new link from the Link bank screen.'}
          </Text>
        )}
      </ScrollView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40 },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  backText: { fontSize: 15 },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    gap: 6,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { fontSize: 17, fontWeight: '700' },
  cardMeta: { fontSize: 14, lineHeight: 20 },
  cta: { marginTop: 20 },
  pendingHint: { marginTop: 18, fontSize: 14, lineHeight: 20 },
});
