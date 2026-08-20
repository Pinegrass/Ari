import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import * as WebBrowser from 'expo-web-browser';

import ScreenShell from '../components/ScreenShell';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Icon from '../components/ui/Icon';
import { useHaptics } from '../hooks/useHaptics';
import { useColors } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { track } from '../lib/analytics';
import { createAaConsent, getAaConsent } from '../api/aa';
import type { MainStackParamList } from '../navigation/navigationTypes';

const AA_REDIRECT = 'ari://aa-callback';
const POLL_INTERVAL_MS = 3000;
const POLL_ATTEMPTS = 20; // ~60s — Setu approval usually lands in seconds.

/** One bank-account type we ask Setu to include in the consent. */
const FI_TYPES: { key: string; label: string; hint: string }[] = [
  { key: 'DEPOSIT', label: 'Savings / current account', hint: 'Statement + balance' },
  { key: 'TERM_DEPOSIT', label: 'Fixed deposit', hint: 'FD holdings' },
  { key: 'RECURRING_DEPOSIT', label: 'Recurring deposit', hint: 'RD schedule' },
  { key: 'CREDIT_CARD', label: 'Credit card', hint: 'Card statement' },
];

export default function LinkBankConsentScreen() {
  const navigation = useNavigation<StackNavigationProp<MainStackParamList>>();
  const haptics = useHaptics();
  const c = useColors();
  const { user } = useAuth();

  const [vua, setVua] = useState(user?.phone ? `${user.phone}@onemoney` : '');
  const [fiTypes, setFiTypes] = useState<string[]>(['DEPOSIT']);
  const [submitting, setSubmitting] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    track('aa_consent_started');
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const toggleFiType = (key: string) => {
    haptics.light();
    setFiTypes((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const startConsent = async () => {
    const trimmed = vua.trim();
    if (!trimmed) {
      Alert.alert('Bank ID needed', 'Enter your AA VUA — usually your phone number @onemoney (e.g. 9876543210@onemoney).');
      return;
    }

    setSubmitting(true);
    try {
      const created = await createAaConsent(trimmed, fiTypes.length ? fiTypes : ['DEPOSIT']);
      if (!created.redirectUrl) {
        Alert.alert('Consent created', 'Your bank approval link is not ready yet. Try again in a minute.');
        return;
      }

      // Hand the user to Setu's consent page in a secure in-app browser.
      const result = await WebBrowser.openAuthSessionAsync(created.redirectUrl, AA_REDIRECT);
      if (result.type !== 'success' && result.type !== 'dismiss') {
        // 'cancel' — user backed out without approving.
        return;
      }

      // Poll until Setu marks the consent ACTIVE (or we run out of patience).
      setWaiting(true);
      let attempts = 0;
      pollRef.current = setInterval(async () => {
        attempts += 1;
        try {
          const detail = await getAaConsent(created.consentHandle);
          if (detail.status === 'ACTIVE') {
            stopPolling();
            track('aa_consent_completed', { consentHandle: created.consentHandle });
            Alert.alert('Bank linked', 'Your bank transactions will start syncing shortly.', [
              { text: 'Done', onPress: () => navigation.goBack() },
            ]);
            return;
          }
          if (detail.status === 'EXPIRED' || detail.status === 'REVOKED') {
            stopPolling();
            setWaiting(false);
            Alert.alert('Approval expired', 'The bank approval window closed. Start again to link your bank.');
            return;
          }
        } catch {
          // Transient poll failure — keep polling until the attempt budget runs out.
        }
        if (attempts >= POLL_ATTEMPTS) {
          stopPolling();
          setWaiting(false);
          Alert.alert(
            'Still waiting',
            'Your bank is taking longer than usual. We’ll keep checking in the background â pull to refresh the Link bank screen in a minute.',
          );
        }
      }, POLL_INTERVAL_MS);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong while contacting your bank.';
      Alert.alert('Couldn’t link bank', message);
    } finally {
      setSubmitting(false);
    }
  };

  if (waiting) {
    return (
      <ScreenShell edges={['top', 'bottom']} backgroundColor={c.cream}>
        <View style={styles.waitingWrap}>
          <LoadingSpinner message="Waiting for your bank approval…" fullScreen />
          <Text style={[styles.waitingHint, { color: c.inkSoft }]}>
            Approve the consent on your bank’s page, then come back here.
          </Text>
        </View>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell edges={['top', 'bottom']} backgroundColor={c.cream}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
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
            <Text style={[styles.backText, { color: c.inkSoft }]}>Link bank</Text>
          </TouchableOpacity>

          <Text style={[styles.title, { color: c.ink }]}>Approve bank access</Text>
          <Text style={[styles.subtitle, { color: c.inkSoft }]}>
            Ari uses Setu (an RBI-licensed Account Aggregator) to read your statements read-only.
            You approve the exact accounts and can revoke access any time.
          </Text>

          <Input
            label="Bank ID (AA VUA)"
            value={vua}
            onChangeText={setVua}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            placeholder="9876543210@onemoney"
            editable={!submitting}
          />

          <Text style={[styles.sectionLabel, { color: c.inkSoft }]}>Accounts to include</Text>
          <View style={styles.chipWrap}>
            {FI_TYPES.map((ft) => {
              const selected = fiTypes.includes(ft.key);
              return (
                <TouchableOpacity
                  key={ft.key}
                  onPress={() => toggleFiType(ft.key)}
                  disabled={submitting}
                  style={[
                    styles.chip,
                    { borderColor: selected ? c.forest : c.line, backgroundColor: selected ? c.clayTint : c.card },
                  ]}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: selected }}
                  accessibilityLabel={ft.label}
                >
                  <Text style={[styles.chipLabel, { color: c.ink }]}>{ft.label}</Text>
                  <Text style={[styles.chipHint, { color: c.inkSoft }]}>{ft.hint}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Button
            onPress={() => void startConsent()}
            loading={submitting}
            disabled={submitting || fiTypes.length === 0}
            fullWidth
            accessibilityLabel="Continue to bank approval"
            style={styles.cta}
          >
            Continue to bank approval
          </Button>

          <Text style={[styles.finePrint, { color: c.inkFaint }]}>
            Consent is valid for one year and can be revoked from Settings at any time.
            Ari never sees your bank login or password.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { padding: 20, paddingBottom: 40 },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  backText: { fontSize: 15 },
  title: { fontSize: 26, fontWeight: '700', marginBottom: 6 },
  subtitle: { fontSize: 14, lineHeight: 20, marginBottom: 18 },
  sectionLabel: { fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 18, marginBottom: 8 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minWidth: '47%',
  },
  chipLabel: { fontSize: 14, fontWeight: '600' },
  chipHint: { fontSize: 12, marginTop: 1 },
  cta: { marginTop: 24 },
  finePrint: { fontSize: 12, lineHeight: 17, marginTop: 14, textAlign: 'center' },
  waitingWrap: { flex: 1, justifyContent: 'center', padding: 24 },
  waitingHint: { textAlign: 'center', marginTop: -20, fontSize: 14, lineHeight: 20 },
});
