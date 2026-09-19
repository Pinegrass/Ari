import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useLanguage } from '../i18n/LanguageContext';
import { privacyHindi } from '../i18n/legalHindi';
import ScreenShell from '../components/ScreenShell';
import { color, font } from '../theme/tokens';
import Icon from '../components/ui/Icon';

const sections = [
  ['Account and product data', 'Pinegrass Technologies Private Limited provides Ari. Ari stores account details you provide and records you choose to add: transactions, notes, budgets, goals, planning inputs, tax profiles and shared expenses. Group members can see shared-group information. Country, currency and language are product preferences; this notice does not claim that Ari infers your location from your IP address.'],
  ['Voice and AI', 'Voice uses your device speech service. Ari does not require on-device-only recognition; the operating system or speech provider may use a network service. The current voice-capture implementation receives transcription text rather than uploading an audio recording to the Ari API. Typed or transcribed text can be sent for entry parsing. Tomo requests can include your message and relevant financial context sent through the backend to its configured DeepSeek or Google Gemini provider. Avoid unnecessary sensitive information.'],
  ['Optional first-party measurement', 'Help improve Ari is off until you opt in. It stores account-linked allowlisted action counts, opaque identifiers, server receipt times, a consent identifier and timezone. Events can include confirmed entries, planning saves, trial starts, report/insight actions, notification delivery/opens and verified billing lifecycle events. Measurement payloads exclude amounts, notes, merchants, message contents and recordings. Consented billing observations also store event kind, provider event time, optional subscription cycle start/end, and a consent-scoped pseudonymous subscription reference. Raw provider/customer identifiers, product IDs, currency and payment details are not copied into measurement. These observations expire within the same 90-day history. This optional flow does not use PostHog or session replay.'],
  ['Measurement retention and withdrawal', 'Event history expires after 90 days. Reports exclude expired events; physical cleanup occurs through maintenance and applicable measurement operations. Minimal consent state and timezone remain until withdrawal or account deletion; an expired-activation flag prevents old accounts from appearing newly activated. Staff/test exclusions remain until removed or the account is deleted. Turn off Help improve Ari to erase retained measurement data. A later opt-in starts a new consent identifier.'],
  ['Private Mode and diagnostics', 'Private Mode hides supported amounts and suppresses device measurement calls. It does not withdraw account-level measurement consent or stop server-side billing/notification measurement. It also does not control separate diagnostics. Configured Sentry monitoring may receive errors, breadcrumbs, device/build and performance details and mobile account ID/name/email. Mobile screenshot attachment is disabled. Universal personal-data redaction is not guaranteed.'],
  ['Services and optional features', 'The product integrates Supabase for authentication/data storage, Railway for backend hosting, Vercel for the website, Expo for notifications, configured AI and sign-in providers, and optional billing/bank services such as RevenueCat, app stores, configured payment providers and Setu. Availability depends on configuration and your chosen features. Notification permission and preferences are separate from measurement consent. Provider-hosted services have their own privacy information.'],
  ['Export and deletion', 'Review and correct supported records, download an account export, change notification preferences, withdraw optional measurement consent or request account deletion in Settings. The current deletion flow verifies your account password. Contact privacy@pinegrass.in if you cannot use it. Infrastructure backups and external billing/diagnostic records have separate retention processes; a fixed backup-erasure deadline is not verified here. Account deletion does not automatically cancel a store subscription.'],
  ['Security and contact', 'Hosted requests use HTTPS and account-scoped access controls. No service can guarantee that every security incident will be prevented. This notice does not certify vendor contracts, data residency or compliance in every jurisdiction. Ari is not intended for users under 18. Contact Pinegrass Technologies Private Limited at privacy@pinegrass.in. Last updated: 20 September 2026.'],
] as const;

export default function PrivacyPolicyScreen({ onBack }: { onBack: () => void }) {
  const { phrase, language, setLanguage } = useLanguage();
  const content = language === 'hi' ? privacyHindi : sections;
  return <ScreenShell edges={['top']}>
    <View style={styles.header}><TouchableOpacity accessibilityRole="button" accessibilityLabel={phrase('Go back')} onPress={onBack} style={styles.backBtn}><Icon name="chevron-left" size={24} color={color.ink}/></TouchableOpacity><Text accessibilityLanguage={language} style={styles.headerTitle}>{phrase('Privacy Policy')}</Text><View style={styles.backBtn}/></View>
    <ScrollView contentContainerStyle={styles.content}>
      <TouchableOpacity accessibilityRole="button" onPress={() => { void setLanguage(language === 'hi' ? 'en' : 'hi'); }}><Text accessibilityLanguage={language === 'hi' ? 'en' : 'hi'} style={styles.lastUpdated}>{language === 'hi' ? 'Read in English' : 'हिन्दी में पढ़ें'}</Text></TouchableOpacity>
      <Text accessibilityLanguage={language} style={styles.lastUpdated}>{language === 'hi' ? 'गोपनीयता नीति · 20 सितंबर 2026' : 'Privacy Policy · 20 September 2026'}</Text>
      {content.map(([title, body]) => <View key={title}><Text accessibilityLanguage={language} accessibilityRole="header" style={styles.sectionTitle}>{title}</Text><Text accessibilityLanguage={language} style={styles.body}>{body}</Text></View>)}
    </ScrollView>
  </ScreenShell>;
}
const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontFamily: font.display, fontWeight: '600', color: color.ink },
  content: { paddingHorizontal: 20, paddingBottom: 60 },
  lastUpdated: { fontSize: 12, color: color.inkFaint, marginBottom: 20, marginTop: 8 },
  sectionTitle: { fontSize: 16, fontFamily: font.display, fontWeight: '600', color: color.ink, marginTop: 24, marginBottom: 8 },
  body: { fontSize: 14, lineHeight: 22, color: color.inkSoft, marginBottom: 10 },
});
