import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';

import ScreenShell from '../components/ScreenShell';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import AnimatedEntry from '../components/ui/AnimatedEntry';
import Icon from '../components/ui/Icon';
import { useHaptics } from '../hooks/useHaptics';
import { useLocale } from '../hooks/useLocale';
import { useColors } from '../context/ThemeContext';
import { getAaStatus, getAaConsents, type AaStatus, type AaConsentSummary } from '../api/aa';
import type { MainStackParamList } from '../navigation/navigationTypes';

/** Human label for a consent's current Setu status. */
function statusLabel(status: string): string {
  switch ((status || '').toUpperCase()) {
    case 'ACTIVE':
      return 'Linked';
    case 'PENDING':
      return 'Awaiting approval';
    case 'EXPIRED':
      return 'Expired';
    case 'REVOKED':
      return 'Revoked';
    default:
      return status || 'Unknown';
  }
}

export default function LinkBankScreen() {
  const navigation = useNavigation<StackNavigationProp<MainStackParamList>>();
  const haptics = useHaptics();
  const c = useColors();
  const { formatDate } = useLocale();

  const [status, setStatus] = useState<AaStatus | null>(null);
  const [consents, setConsents] = useState<AaConsentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    try {
      const [st, list] = await Promise.all([getAaStatus(), getAaConsents()]);
      setStatus(st);
      setConsents(list.consents ?? []);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  if (loading) {
    return (
      <ScreenShell edges={['top', 'bottom']} backgroundColor={c.cream}>
        <LoadingSpinner message="Checking bank linking…" fullScreen />
      </ScreenShell>
    );
  }

  if (error || !status) {
    return (
      <ScreenShell edges={['top', 'bottom']} backgroundColor={c.cream}>
        <EmptyState
          emoji="📡"
          title="Couldn't reach Ari"
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

  if (!status.enabled) {
    return (
      <ScreenShell edges={['top', 'bottom']} backgroundColor={c.cream}>
        <EmptyState
          emoji="🏦"
          title="Bank linking isn't available yet"
          subtitle="We're finishing the secure bank-sync pilot with Setu. It'll show up here once it's live."
        />
      </ScreenShell>
    );
  }

  return (
    <ScreenShell edges={['top', 'bottom']} backgroundColor={c.cream}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
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
          <Text style={[styles.backText, { color: c.inkSoft }]}>Settings</Text>
        </TouchableOpacity>

        <Text style={[styles.title, { color: c.ink }]}>Link bank account</Text>
        <Text style={[styles.subtitle, { color: c.inkSoft }]}>
          Securely import your bank transactions so Ari can track spending you didn’t type yourself.
        </Text>

        <AnimatedEntry>
          <View style={[styles.hero, { backgroundColor: c.card, borderColor: c.line }]}>
            <Icon name={status.linked ? 'check-circle' : 'wallet'} size={30} color={status.linked ? c.forest : c.inkSoft} />
            <Text style={[styles.heroTitle, { color: c.ink }]}>
              {status.linked ? 'Bank account linked' : 'No bank linked yet'}
            </Text>
            <Text style={[styles.heroBody, { color: c.inkSoft }]}>
              {status.linked
                ? 'Your linked accounts appear below. Tap one to sync the latest transactions.'
                : 'You’ll approve a one-year read-only consent with your bank via Setu’s secure page.'}
            </Text>
            {!status.linked && (
              <Button
                onPress={() => {
                  haptics.light();
                  navigation.navigate('LinkBankConsent');
                }}
                accessibilityLabel="Link bank account"
                style={styles.heroButton}
              >
                Link bank account
              </Button>
            )}
          </View>
        </AnimatedEntry>

        {consents.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: c.inkSoft }]}>Linked accounts</Text>
            {consents.map((row) => (
              <TouchableOpacity
                key={row.id}
                onPress={() => {
                  haptics.light();
                  navigation.navigate('LinkBankConsentDetail', { consentHandle: row.consentHandle });
                }}
                style={[styles.row, { backgroundColor: c.card, borderColor: c.line }]}
                accessibilityLabel={`Bank consent ${statusLabel(row.status)}`}
                accessibilityRole="button"
              >
                <View style={styles.rowMain}>
                  <Text style={[styles.rowTitle, { color: c.ink }]}>
                    {row.fiTypes?.join(', ') || 'Bank account'}
                  </Text>
                  <Text style={[styles.rowMeta, { color: c.inkSoft }]}>
                    {row.lastFetchedAt
                      ? `Synced ${formatDate(new Date(row.lastFetchedAt), { day: 'numeric', month: 'short' })}`
                      : `Started ${formatDate(new Date(row.createdAt), { day: 'numeric', month: 'short' })}`}
                  </Text>
                </View>
                <View style={[styles.badge, { backgroundColor: row.status === 'ACTIVE' ? c.clayTint : c.line }]}>
                  <Text style={[styles.badgeText, { color: c.inkSoft }]}>{statusLabel(row.status)}</Text>
                </View>
                <Icon name="chevron-right" size={18} color={c.inkFaint} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40 },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  backText: { fontSize: 15 },
  title: { fontSize: 26, fontWeight: '700', marginBottom: 6 },
  subtitle: { fontSize: 15, lineHeight: 21, marginBottom: 18 },
  hero: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    gap: 8,
  },
  heroTitle: { fontSize: 17, fontWeight: '700' },
  heroBody: { fontSize: 14, lineHeight: 20 },
  heroButton: { marginTop: 10, alignSelf: 'flex-start' },
  section: { marginTop: 22, gap: 10 },
  sectionLabel: { fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 2 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  rowMain: { flex: 1, gap: 2 },
  rowTitle: { fontSize: 15, fontWeight: '600' },
  rowMeta: { fontSize: 13 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  badgeText: { fontSize: 11, fontWeight: '600' },
});
