import { termsHindi } from '../i18n/legalHindi';
import { useLanguage } from '../i18n/LanguageContext';
/* eslint-disable react/no-unescaped-entities */
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import ScreenShell from '../components/ScreenShell';
import { color, font } from '../theme/tokens';
import AnimatedEntry from '../components/ui/AnimatedEntry';
import Icon from '../components/ui/Icon';

interface Props { onBack: () => void; }

const LAST_UPDATED = '2026-09-20';

export default function TermsScreen({ onBack }: Props) {
  const {phrase, language, setLanguage}=useLanguage();
  return (
    <ScreenShell edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel={phrase('Go back')} onPress={onBack} style={styles.backBtn}>
          <Icon name="chevron-left" size={24} color={color.ink} />
        </TouchableOpacity>
        <Text accessibilityLanguage={language} style={styles.headerTitle}>{phrase('Terms of Service')}</Text>
        <View style={styles.backBtn} />
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <AnimatedEntry delay={0}>
          <TouchableOpacity accessibilityRole="button" onPress={() => { void setLanguage(language === 'hi' ? 'en' : 'hi'); }}><Text accessibilityLanguage={language === 'hi' ? 'en' : 'hi'} style={styles.lastUpdated}>{language === 'hi' ? 'Read in English' : 'हिन्दी में पढ़ें'}</Text></TouchableOpacity>
          <Text accessibilityLanguage={language} style={styles.lastUpdated}>{language === 'hi' ? 'अंतिम अपडेट: 20 सितंबर 2026' : `Last updated: ${LAST_UPDATED}`}</Text>
          {language === 'hi' ? termsHindi.map(([title, body]) => <View key={title}><Text accessibilityLanguage="hi" accessibilityRole="header" style={styles.sectionTitle}>{title}</Text><Text accessibilityLanguage="hi" style={styles.body}>{body}</Text></View>) : <>

          <Text accessibilityLanguage={language} style={styles.sectionTitle}>1. Acceptance of Terms</Text>
          <Text accessibilityLanguage={language} style={styles.body}>
            By downloading, installing, or using the Ari mobile application ("Ari" or the "Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree, do not use Ari.
          </Text>
          <Text accessibilityLanguage={language} style={styles.body}>
            These Terms form a binding agreement between you and Pinegrass Technologies Private Limited ("Pinegrass", "we", "our", "us"), a company incorporated in India (CIN U62011MN2026PTC015607).
          </Text>

          <Text accessibilityLanguage={language} style={styles.sectionTitle}>2. Eligibility</Text>
          <Text accessibilityLanguage={language} style={styles.body}>
            You must be at least 18 years of age to use Ari. By using Ari, you represent that you meet this age requirement. Ari is designed for users in India and complies with Indian laws including the DPDP Act, 2023.
          </Text>

          <Text accessibilityLanguage={language} style={styles.sectionTitle}>3. Description of Service</Text>
          <Text accessibilityLanguage={language} style={styles.body}>
            Ari is a personal finance management application that helps you track expenses, manage budgets, set savings goals, receive AI-powered financial coaching ("Tomo"), and generate tax estimates. Ari does not provide financial, legal, or tax advice. All insights are informational only.
          </Text>

          <Text accessibilityLanguage={language} style={styles.sectionTitle}>4. User Accounts</Text>
          <Text accessibilityLanguage={language} style={styles.body}>
            You are responsible for maintaining the confidentiality of your account credentials. You agree to provide accurate information and to update it as necessary. We reserve the right to suspend or terminate accounts that violate these Terms.
          </Text>
          <Text accessibilityLanguage={language} style={styles.body}>
            You may delete your account at any time through Settings. Account deletion is governed by our Privacy Policy.
          </Text>

          <Text accessibilityLanguage={language} style={styles.sectionTitle}>5. Subscriptions and Payments</Text>
          <Text accessibilityLanguage={language} style={styles.body}>
            Ari offers free features and optional paid access ("Ari Pro"), subject to availability. The eligible 14-day Ari trial requires no card and does not automatically become a paid subscription. A purchase requires a separate checkout. Before purchasing, review the price, billing period, renewal, cancellation and refund terms shown by the applicable store or checkout provider. Manage an existing subscription through the provider used to purchase it.
          </Text>

          <Text accessibilityLanguage={language} style={styles.sectionTitle}>6. Acceptable Use</Text>
          <Text accessibilityLanguage={language} style={styles.body}>
            You agree not to:{'\n'}
            • Use Ari for any unlawful purpose{'\n'}
            • Attempt to gain unauthorized access to Ari's systems{'\n'}
            • Upload malicious code or attempt to disrupt the Service{'\n'}
            • Violate any applicable laws or regulations
          </Text>

          <Text accessibilityLanguage={language} style={styles.sectionTitle}>7. Intellectual Property</Text>
          <Text accessibilityLanguage={language} style={styles.body}>
            Ari, its name, logo, design, and code are the intellectual property of Pinegrass Technologies Pvt. Ltd. You may not copy, modify, distribute, or create derivative works without our written permission.
          </Text>

          <Text accessibilityLanguage={language} style={styles.sectionTitle}>8. Limitation of Liability</Text>
          <Text accessibilityLanguage={language} style={styles.body}>
            To the maximum extent permitted by law, Pinegrass shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of Ari. Our total liability shall not exceed the amount you paid us in the 12 months preceding the claim, or ₹5,000, whichever is greater.
          </Text>
          <Text accessibilityLanguage={language} style={styles.body}>
            Ari provides informational tools, not professional financial advice. You are solely responsible for your financial decisions.
          </Text>

          <Text accessibilityLanguage={language} style={styles.sectionTitle}>9. Disclaimer of Warranties</Text>
          <Text accessibilityLanguage={language} style={styles.body}>
            Ari is provided "as is" without warranties of any kind, express or implied. We do not warrant that Ari will be uninterrupted, error-free, or completely secure.
          </Text>

          <Text accessibilityLanguage={language} style={styles.sectionTitle}>10. Governing Law and Dispute Resolution</Text>
          <Text accessibilityLanguage={language} style={styles.body}>
            These Terms are governed by the laws of India. Any dispute arising from these Terms shall be subject to the exclusive jurisdiction of courts in Manipur, India. Before initiating formal proceedings, you agree to attempt resolution through our Grievance Officer at privacy@pinegrass.in.
          </Text>

          <Text accessibilityLanguage={language} style={styles.sectionTitle}>11. Changes to Terms</Text>
          <Text accessibilityLanguage={language} style={styles.body}>
            We may update these Terms from time to time. Material changes will be notified through the app. Continued use after changes constitutes acceptance.
          </Text>

          <Text accessibilityLanguage={language} style={styles.sectionTitle}>12. Contact</Text>
          <Text accessibilityLanguage={language} style={styles.body}>
            Pinegrass Technologies Pvt. Ltd.{'\n'}
            Email: privacy@pinegrass.in{'\n'}
            CIN: U62011MN2026PTC015607{'\n'}
            Manipur, India
          </Text>
          </>}
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
});
