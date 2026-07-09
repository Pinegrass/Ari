import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import ScreenShell from '../components/ScreenShell';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { color, font, type as typeScale } from '../theme/tokens';
import Icon from '../components/ui/Icon';
import type { IconName } from '../components/ui/Icon';
import { track } from '../lib/analytics';
import { useHaptics } from '../hooks/useHaptics';

/**
 * Onboarding — Sprint 3 (D4). Value-first, ≤3 skippable steps, ending in a live
 * fast-entry keypad so the user *feels* how fast logging is before they sign up.
 * Target: value understood + first (demo) amount punched in under 60 seconds.
 *
 * Onboarding runs pre-auth (RootNavigator), so the keypad step is a demonstration
 * — the amount they enter is stashed to prefill their genuine first entry right
 * after signup rather than persisted here. Profiling (age/income/goal) stays out
 * of onboarding entirely; it's collected optionally at Register / Settings.
 *
 * Funnel: onboarding_started (mount) → onboarding_step_completed / _skipped per
 * step → onboarding_first_transaction (demo amount entered) → onboarding_completed.
 */

const DEMO_AMOUNT_KEY = 'ari_onboarding_demo_amount';
const STARTED_AT_KEY = 'ari_onboarding_started_at';

interface Props {
  onComplete: () => void;
}

const FEATURES: { icon: IconName; title: string; desc: string }[] = [
  { icon: 'bell', title: 'Bill reminders', desc: 'Rent, EMI & bills — nudged the day before' },
  { icon: 'bot', title: 'Tomo, your AI coach', desc: 'Ask anything about your money' },
  { icon: 'briefcase', title: 'Tax, sorted', desc: 'Old vs new regime, 80C, HRA & GST' },
];

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

export default function OnboardingScreen({ onComplete }: Props) {
  const haptics = useHaptics();
  const [step, setStep] = useState(0);
  const [amount, setAmount] = useState('');
  const [logged, setLogged] = useState(false);
  const startedAt = useRef(Date.now());

  useEffect(() => {
    track('onboarding_started', {});
    AsyncStorage.setItem(STARTED_AT_KEY, String(startedAt.current)).catch(() => {});
  }, []);

  const elapsedMs = () => Date.now() - startedAt.current;

  const finish = () => {
    // Completing onboarding implies ToS / Privacy consent (links shown on the
    // value step). Kept as a discrete event for the DPDPA audit trail.
    track('consent_accepted', { flow: 'onboarding' });
    track('onboarding_completed', { elapsed_ms: elapsedMs(), logged_demo: logged });
    onComplete();
  };

  const skip = () => {
    track('onboarding_step_skipped', { step });
    finish();
  };

  const next = () => {
    haptics.light();
    track('onboarding_step_completed', { step, elapsed_ms: elapsedMs() });
    if (step < 2) setStep(step + 1);
    else finish();
  };

  const pressKey = (k: string) => {
    haptics.light();
    if (k === 'del') {
      setAmount((a) => a.slice(0, -1));
      return;
    }
    if (!k) return;
    setAmount((a) => (a.length >= 7 ? a : (a === '0' ? k : a + k)));
  };

  const logDemo = () => {
    const amt = parseInt(amount, 10);
    if (!Number.isFinite(amt) || amt <= 0) return;
    haptics.success();
    setLogged(true);
    AsyncStorage.setItem(DEMO_AMOUNT_KEY, String(amt)).catch(() => {});
    track('onboarding_first_transaction', {
      seconds: Math.round(elapsedMs() / 1000),
      amount_len: amount.length, // coarse; avoids sending the raw figure
      demo: true,
    });
  };

  return (
    <View style={styles.screen}>
      <ScreenShell edges={['top', 'bottom']}>
        {/* Header: progress dots + skip */}
        <View style={styles.top}>
          <View style={styles.dots}>
            {[0, 1, 2].map((i) => (
              <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
            ))}
          </View>
          <TouchableOpacity onPress={skip} accessibilityRole="button" accessibilityLabel="Skip">
            <Text style={styles.skip}>Skip</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.body}>
          {step === 0 && (
            <View style={styles.center}>
              <View style={styles.ring}>
                <Icon name="sprout" size={52} color={color.forest} />
              </View>
              <Text style={styles.h1}>Money, tracked{'\n'}in seconds</Text>
              <Text style={styles.sub}>
                Ari is the fastest way for Indians to log spending, catch bills, and
                stay on budget — no spreadsheets, no fuss.
              </Text>
              {/* Demo dashboard glimpse — show, don't ask */}
              <View style={styles.glimpse}>
                <Text style={styles.glimpseLabel}>Spent today</Text>
                <Text style={styles.glimpseAmount}>₹0</Text>
                <Text style={styles.glimpseHint}>{"Let's change that in a moment →"}</Text>
              </View>
            </View>
          )}

          {step === 1 && (
            <View style={styles.center}>
              <Text style={styles.h1}>Everything your{'\n'}money needs</Text>
              <View style={styles.features}>
                {FEATURES.map((f) => (
                  <View key={f.title} style={styles.featureRow}>
                    <View style={styles.featureIcon}>
                      <Icon name={f.icon} size={22} color={color.forest} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.featureTitle}>{f.title}</Text>
                      <Text style={styles.featureDesc}>{f.desc}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {step === 2 && (
            <View style={styles.center}>
              <Text style={styles.h1}>Try it — log a spend</Text>
              <Text style={styles.sub}>This is the whole flow. Punch in an amount.</Text>

              <Text style={styles.amount}>₹{amount ? Number(amount).toLocaleString('en-IN') : '0'}</Text>

              {logged ? (
                <View style={styles.doneRow}>
                  <Icon name="check-circle" size={22} color={color.forest} />
                  <Text style={styles.doneText}>That fast. Create your account to save it.</Text>
                </View>
              ) : (
                <View style={styles.keypad}>
                  {KEYS.map((k, i) => (
                    <TouchableOpacity
                      key={i}
                      style={[styles.key, !k && styles.keyEmpty]}
                      disabled={!k}
                      onPress={() => pressKey(k)}
                      accessibilityLabel={k === 'del' ? 'Delete' : k}
                    >
                      {k === 'del' ? (
                        <Icon name="x" size={20} color={color.ink} />
                      ) : (
                        <Text style={styles.keyText}>{k}</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>

        {/* Footer CTA */}
        <View style={styles.footer}>
          {step === 2 && !logged ? (
            <TouchableOpacity
              style={[styles.cta, !amount && styles.ctaDisabled]}
              onPress={logDemo}
              disabled={!amount}
              activeOpacity={0.85}
            >
              <Text style={styles.ctaText}>Log it</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.cta} onPress={next} activeOpacity={0.85}>
              <Text style={styles.ctaText}>
                {step < 2 ? 'Next' : 'Create account'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScreenShell>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.cream },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 4,
  },
  dots: { flexDirection: 'row', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: color.line },
  dotActive: { width: 24, backgroundColor: color.forest },
  skip: { fontSize: 15, color: color.inkSoft, fontFamily: font.bodyMed },

  body: { flex: 1, justifyContent: 'center', paddingHorizontal: 32 },
  center: { alignItems: 'center' },
  ring: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: color.cream2,
    borderWidth: 2,
    borderColor: color.forest,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  h1: {
    fontSize: 28,
    fontFamily: font.displayBold,
    color: color.ink,
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  sub: {
    fontSize: 15,
    color: color.inkSoft,
    textAlign: 'center',
    lineHeight: 22,
    fontFamily: font.body,
    marginBottom: 20,
  },
  glimpse: {
    backgroundColor: color.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: color.line,
    paddingVertical: 20,
    paddingHorizontal: 28,
    alignItems: 'center',
    marginTop: 8,
  },
  glimpseLabel: { fontSize: typeScale.eyebrow, fontFamily: font.bodyMed, color: color.inkSoft, textTransform: 'uppercase', letterSpacing: 0.5 },
  glimpseAmount: { fontSize: 44, fontFamily: font.displayBold, color: color.forestDeep, marginVertical: 4 },
  glimpseHint: { fontSize: typeScale.caption, fontFamily: font.body, color: color.moss },

  features: { alignSelf: 'stretch', gap: 16, marginTop: 12 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: color.cream2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTitle: { fontSize: 16, fontFamily: font.bodySemi, color: color.ink },
  featureDesc: { fontSize: 13, fontFamily: font.body, color: color.inkSoft, marginTop: 2 },

  amount: { fontSize: 56, fontFamily: font.displayBold, color: color.forestDeep, marginVertical: 18 },
  keypad: { flexDirection: 'row', flexWrap: 'wrap', width: 260, justifyContent: 'space-between' },
  key: {
    width: 76,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
    borderRadius: 14,
    backgroundColor: color.card,
    borderWidth: 1,
    borderColor: color.line,
  },
  keyEmpty: { backgroundColor: 'transparent', borderColor: 'transparent' },
  keyText: { fontSize: 24, fontFamily: font.displaySemi, color: color.ink },
  doneRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16, paddingHorizontal: 12 },
  doneText: { flex: 1, fontSize: 15, fontFamily: font.bodyMed, color: color.forestDeep, lineHeight: 21 },

  footer: { paddingHorizontal: 24, paddingBottom: 24, paddingTop: 8 },
  cta: {
    backgroundColor: color.forest,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  ctaDisabled: { backgroundColor: color.lineStrong },
  ctaText: { fontSize: 16, fontFamily: font.bodyBold, color: color.cream, letterSpacing: 0.3 },
});
