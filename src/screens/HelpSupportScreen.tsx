import {useLanguage as useCopyLanguage} from '../i18n/LanguageContext';
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Linking,
  Alert,
  StyleSheet,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import ScreenShell from '../components/ScreenShell';
import { color, font } from '../theme/tokens';
import AnimatedEntry from '../components/ui/AnimatedEntry';
import Icon from '../components/ui/Icon';
import type { IconName } from '../components/ui/Icon';

// LayoutAnimation needs to be enabled on Android — guarded so a hot-reload
// doesn't double-enable it.
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface Props {
  onBack: () => void;
}

interface Faq {
  q: string;
  a: string;
}

/**
 * Plain-English answers to the questions users actually ask in feedback.
 * Keep entries short — if an answer needs more than ~4 lines it probably
 * belongs in a doc, not in-app.
 */
const FAQS: Faq[] = [
  {
    "q": "How do I add a transaction?",
    "a": "Use Add Expense or Add Income from Home. Quick Entry can parse a sentence; review the suggested details before saving."
  },
  {
    "q": "How do I set or change my budget?",
    "a": "Open Budgets to add a category budget or edit an existing budget. Summaries use your recorded entries."
  },
  {
    "q": "Who is Tomo?",
    "a": "Tomo helps review recorded spending and budgets. AI suggestions can be wrong; check the details. It does not provide specific investment advice."
  },
  {
    "q": "How is my data used?",
    "a": "See Privacy Policy for account data, voice and AI processing, optional measurement and diagnostics. Private Mode hides supported amounts; it does not withdraw account-level measurement consent."
  },
  {
    "q": "Can I export my data?",
    "a": "Settings offers transaction exports and a broader account export. Review the export contents before sharing it."
  },
  {
    "q": "How do I change Tomo check-ins?",
    "a": "Open notification preferences in Settings. Availability depends on rollout and device permission. Review the enabled slots and quiet hours there."
  },
  {
    "q": "How do I delete my account?",
    "a": "Use Delete Account in Settings and review the confirmation. Deleting Ari does not cancel store subscriptions. See Privacy Policy for retention details."
  }
];

const SUPPORT_EMAIL = 'support@aritomo.in';

export default function HelpSupportScreen({ onBack }: Props) {
 const {phrase:localizeCopy}=useCopyLanguage();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (i: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenIndex(openIndex === i ? null : i);
  };

  const openEmail = () => {
    const subject = encodeURIComponent(localizeCopy('Ari Support Request'));
    const body = encodeURIComponent(
      localizeCopy('Describe what you need help with:')
    );
    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`).catch(() => {
      Alert.alert(localizeCopy("Could not open email"), SUPPORT_EMAIL);
    });
  };

  const openWebsite = () => {
    Linking.openURL('https://aritomo.in').catch(() => Alert.alert(localizeCopy('Could not open website'), 'https://aritomo.in'));
  };

  return (
    <ScreenShell edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} accessibilityLabel={localizeCopy("Go back")} accessibilityRole="button">
          <Text style={styles.backText}>{localizeCopy("← Back")}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{localizeCopy("Help & Support")}</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero — sets a friendly, "real humans here" tone */}
        <AnimatedEntry delay={60}>
          <View style={styles.heroCard}>
            <View style={styles.heroIcon}>
              <Icon name="help-circle" size={28} color={color.forest} />
            </View>
            <Text style={styles.heroTitle}>{localizeCopy("How can we help?")}</Text>
            <Text style={styles.heroSubtitle}>
              {localizeCopy("Browse the FAQs below or contact support.")}</Text>
          </View>
        </AnimatedEntry>

        {/* Contact actions */}
        <AnimatedEntry delay={120}>
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={openEmail}
              activeOpacity={0.8}
              accessibilityLabel={localizeCopy("Email support")}
              accessibilityRole="button"
            >
              <Icon name="mail" size={22} color={color.forest} />
              <Text style={styles.actionLabel}>{localizeCopy("Email Us")}</Text>
              <Text style={styles.actionSubtitle}>{SUPPORT_EMAIL}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={openWebsite}
              activeOpacity={0.8}
              accessibilityLabel={localizeCopy("Visit website")}
              accessibilityRole="button"
            >
              <Icon name="info" size={22} color={color.forest} />
              <Text style={styles.actionLabel}>{localizeCopy("Website")}</Text>
              <Text style={styles.actionSubtitle}>aritomo.in</Text>
            </TouchableOpacity>
          </View>
        </AnimatedEntry>

        {/* FAQs */}
        <AnimatedEntry delay={180}>
          <Text style={styles.sectionTitle}>{localizeCopy("Frequently Asked")}</Text>
          <View style={styles.faqCard}>
            {FAQS.map((f, i) => {
              const isOpen = openIndex === i;
              return (
                <View key={localizeCopy(f.q)}>
                  <TouchableOpacity
                    style={styles.faqRow}
                    onPress={() => toggle(i)}
                    activeOpacity={0.7}
                    accessibilityLabel={localizeCopy(f.q)}
                    accessibilityRole="button" accessibilityState={{ expanded: isOpen }}
                  >
                    <Text style={styles.faqQuestion}>{localizeCopy(f.q)}</Text>
                    <Icon
                      name={isOpen ? 'chevron-down' : 'chevron-right' as IconName}
                      size={18}
                      color={color.inkFaint}
                    />
                  </TouchableOpacity>
                  {isOpen && (
                    <View style={styles.faqAnswerWrap}>
                      <Text style={styles.faqAnswer}>{localizeCopy(f.a)}</Text>
                    </View>
                  )}
                  {i < FAQS.length - 1 && <View style={styles.separator} />}
                </View>
              );
            })}
          </View>
        </AnimatedEntry>

        <AnimatedEntry delay={240}>
          <Text style={styles.footnote}>
            {localizeCopy("Still need help? Contact support by email.")}</Text>
        </AnimatedEntry>
      </ScrollView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: color.line,
  },
  backText: { fontSize: 16, color: color.inkSoft, fontFamily: font.body },
  title: { fontSize: 17, fontFamily: font.bodyBold, color: color.ink },
  content: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 40, gap: 20 },

  heroCard: {
    backgroundColor: color.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: color.line,
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: color.cream2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  heroTitle: { fontSize: 18, fontFamily: font.bodyBold, color: color.ink },
  heroSubtitle: {
    fontSize: 13,
    color: color.inkSoft,
    textAlign: 'center',
    lineHeight: 19,
    fontFamily: font.body,
  },

  actionRow: { flexDirection: 'row', gap: 12 },
  actionCard: {
    flex: 1,
    backgroundColor: color.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: color.line,
    padding: 16,
    alignItems: 'center',
    gap: 6,
  },
  actionLabel: { fontSize: 14, fontFamily: font.bodySemi, color: color.ink, marginTop: 2 },
  actionSubtitle: { fontSize: 11, color: color.inkFaint, fontFamily: font.body },

  sectionTitle: {
    fontSize: 13,
    color: color.inkSoft,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
    marginLeft: 4,
    fontFamily: font.bodySemi,
  },
  faqCard: {
    backgroundColor: color.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: color.line,
    paddingHorizontal: 16,
  },
  faqRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    gap: 12,
  },
  faqQuestion: { flex: 1, fontSize: 15, fontFamily: font.bodyMed, color: color.ink },
  faqAnswerWrap: {
    paddingBottom: 16,
    paddingRight: 24,
  },
  faqAnswer: { fontSize: 14, color: color.inkSoft, lineHeight: 20, fontFamily: font.body },
  separator: { height: 1, backgroundColor: color.line },

  footnote: {
    fontSize: 13,
    color: color.inkFaint,
    textAlign: 'center',
    marginTop: 8,
    fontFamily: font.body,
  },
});
