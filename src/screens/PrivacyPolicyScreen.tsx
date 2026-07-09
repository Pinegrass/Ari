import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import ScreenShell from '../components/ScreenShell';
import { color, font } from '../theme/tokens';
import AnimatedEntry from '../components/ui/AnimatedEntry';
import Icon from '../components/ui/Icon';

interface Props { onBack: () => void; }

const LAST_UPDATED = '2026-07-08';

export default function PrivacyPolicyScreen({ onBack }: Props) {
  return (
    <ScreenShell edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Icon name="chevron-left" size={24} color={color.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={styles.backBtn} />
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <AnimatedEntry delay={0}>
          <Text style={styles.lastUpdated}>Last updated: {LAST_UPDATED}</Text>

          <Text style={styles.sectionTitle}>1. Introduction</Text>
          <Text style={styles.body}>
            Pinegrass Technologies Private Limited ("Pinegrass", "we", "our", "us") operates the Ari mobile application ("Ari" or the "Service"). This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use Ari.
          </Text>
          <Text style={styles.body}>
            We are committed to protecting your privacy and complying with the Digital Personal Data Protection Act, 2023 (DPDPA) of India and other applicable data protection laws.
          </Text>

          <Text style={styles.sectionTitle}>2. Information We Collect</Text>
          <Text style={styles.body}>
            <Text style={styles.bold}>Account Information:</Text> When you sign up, we collect your name, email address, and authentication credentials via Google Sign-In or email/password. Your authentication is managed through Supabase.
          </Text>
          <Text style={styles.body}>
            <Text style={styles.bold}>Financial Data:</Text> You provide transaction details including amounts, categories, merchants, dates, and payment methods. This data is essential for Ari to provide budgeting, tracking, and insights.
          </Text>
          <Text style={styles.body}>
            <Text style={styles.bold}>Voice Data:</Text> If you use voice input, your speech is transcribed on-device or through a secure service. Voice recordings are not stored.
          </Text>
          <Text style={styles.body}>
            <Text style={styles.bold}>Usage Data:</Text> We collect anonymised app usage statistics (screens visited, features used) via PostHog to improve Ari. No financial data is sent to analytics.
          </Text>
          <Text style={styles.body}>
            <Text style={styles.bold}>Device Information:</Text> Push notification tokens, device model, and OS version are collected for crash reporting (Sentry) and notification delivery.
          </Text>

          <Text style={styles.sectionTitle}>3. How We Use Your Data</Text>
          <Text style={styles.body}>• To provide and maintain the Ari service</Text>
          <Text style={styles.body}>• To categorise transactions, generate budgets, and deliver financial insights</Text>
          <Text style={styles.body}>• To send push notifications for reminders, budget alerts, and weekly briefs</Text>
          <Text style={styles.body}>• To improve Ari through anonymised usage analytics</Text>
          <Text style={styles.body}>• To detect and prevent fraud, abuse, or security incidents</Text>
          <Text style={styles.body}>• To comply with legal obligations</Text>

          <Text style={styles.sectionTitle}>4. AI and Third-Party Processing</Text>
          <Text style={styles.body}>
            Ari's AI coach ("Tomo") may process your transaction data to provide personalised financial guidance. Before any data is sent to an AI provider, personally identifiable information (PII) such as account numbers, card details, and full names are stripped. AI requests are ephemeral and not used to train models.
          </Text>
          <Text style={styles.body}>
            We use the following third-party services:{'\n'}
            • Supabase — authentication and database hosting{'\n'}
            • Sentry — crash and error reporting{'\n'}
            • PostHog — product analytics{'\n'}
            • Google — authentication (Sign-In)
          </Text>

          <Text style={styles.sectionTitle}>5. Data Storage and Security</Text>
          <Text style={styles.body}>
            Your data is encrypted in transit (TLS 1.3) and at rest (AES-256). We use Supabase's managed infrastructure with regular security updates. You may enable biometric lock (Face ID / fingerprint) in Settings for an additional layer of device-level security.
          </Text>

          <Text style={styles.sectionTitle}>6. Data Retention and Deletion</Text>
          <Text style={styles.body}>
            We retain your data for as long as your account is active. You may delete your account at any time from Settings → Delete Account. Account deletion permanently removes your personal data, transaction history, budgets, and associated records within 30 days. Some anonymised aggregate data may be retained for legal compliance.
          </Text>
          <Text style={styles.body}>
            To request data export or deletion, contact us at privacy@pinegrass.in.
          </Text>

          <Text style={styles.sectionTitle}>7. Your Rights (DPDPA)</Text>
          <Text style={styles.body}>
            Under India's DPDP Act, you have the right to:{'\n'}
            • Access a summary of your personal data{'\n'}
            • Correct inaccurate or incomplete data{'\n'}
            • Request erasure of your data{'\n'}
            • Nominate a representative for your data rights{'\n'}
            • Grievance redressal through our Grievance Officer
          </Text>

          <Text style={styles.sectionTitle}>8. Children's Privacy</Text>
          <Text style={styles.body}>
            Ari is not intended for users under 18. We do not knowingly collect data from children. If you believe a child has provided us with personal data, contact us immediately.
          </Text>

          <Text style={styles.sectionTitle}>9. Contact Us</Text>
          <Text style={styles.body}>
            Pinegrass Technologies Pvt. Ltd.{'\n'}
            Email: privacy@pinegrass.in{'\n'}
            Grievance Officer: privacy@pinegrass.in{'\n'}
            Response time: within 30 days
          </Text>
        </AnimatedEntry>
      </ScrollView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontFamily: font.display, fontWeight: '600', color: color.ink },
  content: { paddingHorizontal: 20, paddingBottom: 60 },
  lastUpdated: { fontSize: 12, color: color.inkFaint, marginBottom: 20, marginTop: 8 },
  sectionTitle: { fontSize: 16, fontFamily: font.display, fontWeight: '600', color: color.ink, marginTop: 24, marginBottom: 8 },
  body: { fontSize: 14, lineHeight: 22, color: color.inkSoft, marginBottom: 10 },
  bold: { fontWeight: '600', color: color.ink },
});
