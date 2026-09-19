import {useLanguage as useCopyLanguage} from '../i18n/LanguageContext';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Share, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import ScreenShell from '../components/ScreenShell';
import Icon from '../components/ui/Icon';
import ProgressBar from '../components/ui/ProgressBar';
import { getReferralStatus, recordReferralShare, redeemReferral, type ReferralStatus } from '../api/engagement';
import EmptyState from '../components/ui/EmptyState';
import { useHaptics } from '../hooks/useHaptics';
import { track } from '../lib/analytics';
import { color, font, type } from '../theme/tokens';
import type { MainStackParamList } from '../navigation/navigationTypes';

export default function InviteFriendsScreen() {
 const {phrase:localizeCopy}=useCopyLanguage();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<MainStackParamList, 'InviteFriends'>>();
  const haptics = useHaptics();
  const [status, setStatus] = useState<ReferralStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState(route.params?.code ?? '');
  const [redeeming, setRedeeming] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    getReferralStatus().then(setStatus).catch(() => setStatus(null)).finally(() => setLoading(false));
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const share = async () => {
    if (!status) return;
    haptics.light();
    try {
    const result = await Share.share({
      title: localizeCopy('Try Ari with me'),
      message: localizeCopy("I use Ari for money tracking and reports. My invite code is {code}: {url}").replace("{code}", status.code).replace("{url}", status.inviteUrl),
      url: status.inviteUrl,
    });
    if (result.action !== Share.dismissedAction) {
      await recordReferralShare().catch(() => null);
      track('referral_shared', { channel: result.activityType ?? 'system_share' });
      setStatus((value) => value ? { ...value, shares: value.shares + 1 } : value);
      haptics.success();
    }
    } catch { Alert.alert(localizeCopy('Error'), localizeCopy('Could not share invite. Try again.')); }
  };

  const redeem = async () => {
    const value = code.trim().toUpperCase();
    if (!value) return;
    setRedeeming(true);
    try {
      const response = await redeemReferral(value);
      track('referral_redeemed');
      haptics.success();
      setCode('');
      Alert.alert(localizeCopy('Invite applied'), localizeCopy('{name} is credited for your invitation.').replace('{name}', response.inviterName));
    } catch {
      haptics.error();
      Alert.alert(localizeCopy('Could not apply code'), localizeCopy('Check the invite code and try again.'));
    } finally {
      setRedeeming(false);
    }
  };

  return (
    <ScreenShell edges={['top']} scrollable contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity accessibilityRole="button" onPress={() => navigation.goBack()} style={styles.back} accessibilityLabel={localizeCopy("Go back")}><Icon name="arrow-left" size={22} /></TouchableOpacity>
        <View><Text style={styles.headerTitle}>{localizeCopy("Grow your circle")}</Text><Text style={styles.headerSub}>{localizeCopy("Invite people without pressure or spam")}</Text></View>
      </View>

      {loading ? <ActivityIndicator style={styles.loader} color={color.forest} size="large" /> : !status ? <EmptyState emoji="📡" title={localizeCopy("Could not load invitations.")} actionLabel={localizeCopy("Retry")} onAction={load} /> : (
        <>
          <View style={styles.hero}>
            <View style={styles.gift}><Icon name="gift" size={28} color={color.card} /></View>
            <Text style={styles.heroTitle}>{localizeCopy("Money habits are easier together")}</Text>
            <Text style={styles.heroBody}>{localizeCopy("Share Ari when it feels useful. Your friend chooses whether to join and apply your code.")}</Text>
            <View style={styles.codeBox}><Text style={styles.codeLabel}>{localizeCopy("Your invite code")}</Text><Text style={styles.code}>{status.code}</Text></View>
            <TouchableOpacity style={styles.shareButton} onPress={() => void share()} accessibilityRole="button">
              <Icon name="share" size={18} color={color.forest} /><Text style={styles.shareText}>{localizeCopy("Invite a friend")}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <View style={styles.row}><Text style={styles.sectionTitle}>{localizeCopy("Circle progress")}</Text><Text style={styles.progressCount}>{status.accepted}/{status.nextGoal}</Text></View>
            <ProgressBar percentage={status.progress * 100} height={9} />
            <View style={styles.stats}>
              <View><Text style={styles.statValue}>{status.accepted}</Text><Text style={styles.statLabel}>{localizeCopy("joined")}</Text></View>
              <View style={styles.divider} />
              <View><Text style={styles.statValue}>{status.shares}</Text><Text style={styles.statLabel}>{localizeCopy("shares")}</Text></View>
              <View style={styles.divider} />
              <View><Text style={styles.statValue}>{status.badge ? '✓' : '—'}</Text><Text style={styles.statLabel}>{localizeCopy("circle badge")}</Text></View>
            </View>
            <Text style={styles.hint}>{localizeCopy("{count} more accepted invites to reach the next milestone.").replace("{count}", String(Math.max(0, status.nextGoal - status.accepted)))}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{localizeCopy("Were you invited?")}</Text>
            <Text style={styles.body}>{localizeCopy("Apply a friend’s code once. It credits the welcome; it never exposes your financial data.")}</Text>
            <View style={styles.redeemRow}>
              <TextInput value={code} onChangeText={setCode} autoCapitalize="characters" placeholder="ARI123ABC" placeholderTextColor={color.inkFaint} style={styles.input} accessibilityLabel={localizeCopy("Invite code")} />
              <TouchableOpacity accessibilityRole="button" accessibilityLabel={localizeCopy("Apply")} accessibilityState={{ disabled: redeeming || !code.trim(), busy: redeeming }} style={styles.apply} onPress={() => void redeem()} disabled={redeeming || !code.trim()}>
                {redeeming ? <ActivityIndicator color={color.card} /> : <Text style={styles.applyText}>{localizeCopy("Apply")}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 40 }, header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 16 }, back: { padding: 4 }, headerTitle: { fontFamily: font.bodySemi, fontSize: 18, color: color.ink }, headerSub: { fontFamily: font.body, fontSize: 11, color: color.inkSoft, marginTop: 2 }, loader: { marginTop: 120 },
  hero: { marginHorizontal: 20, marginTop: 8, backgroundColor: color.forest, borderRadius: 24, padding: 22, alignItems: 'center' }, gift: { width: 52, height: 52, borderRadius: 18, backgroundColor: color.forest2, alignItems: 'center', justifyContent: 'center' }, heroTitle: { fontFamily: font.displaySemi, fontSize: 23, color: color.card, textAlign: 'center', marginTop: 16 }, heroBody: { fontFamily: font.body, fontSize: 12.5, lineHeight: 19, color: color.cream2, textAlign: 'center', marginTop: 8 }, codeBox: { alignSelf: 'stretch', backgroundColor: color.forest2, borderRadius: 16, padding: 14, alignItems: 'center', marginTop: 18 }, codeLabel: { fontFamily: font.bodyMed, fontSize: 9, color: color.cream2, textTransform: 'uppercase', letterSpacing: 1.2 }, code: { fontFamily: font.bodyBold, fontSize: 22, letterSpacing: 3, color: color.card, marginTop: 5 }, shareButton: { alignSelf: 'stretch', backgroundColor: color.card, borderRadius: 14, paddingVertical: 14, flexDirection: 'row', gap: 9, justifyContent: 'center', alignItems: 'center', marginTop: 12 }, shareText: { fontFamily: font.bodyBold, fontSize: 13, color: color.forest },
  card: { marginHorizontal: 20, marginTop: 14, backgroundColor: color.card, borderWidth: 1, borderColor: color.line, borderRadius: 20, padding: 18 }, row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }, sectionTitle: { fontFamily: font.displaySemi, fontSize: type.sectionHead, color: color.forestDeep }, progressCount: { fontFamily: font.bodyBold, fontSize: 12, color: color.forest }, stats: { flexDirection: 'row', gap: 16, alignItems: 'center', marginTop: 18 }, statValue: { fontFamily: font.displayBold, fontSize: 22, color: color.forest }, statLabel: { fontFamily: font.body, fontSize: 10, color: color.inkSoft }, divider: { width: 1, height: 30, backgroundColor: color.line }, hint: { fontFamily: font.body, fontSize: 11, color: color.inkSoft, marginTop: 14, lineHeight: 17 }, body: { fontFamily: font.body, fontSize: 12, color: color.inkSoft, lineHeight: 18, marginTop: 7 }, redeemRow: { flexDirection: 'row', gap: 9, marginTop: 14 }, input: { flex: 1, borderWidth: 1, borderColor: color.lineStrong, backgroundColor: color.cream, borderRadius: 12, paddingHorizontal: 13, fontFamily: font.bodySemi, color: color.ink, letterSpacing: 1.2 }, apply: { minWidth: 74, backgroundColor: color.forest, borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 }, applyText: { fontFamily: font.bodySemi, color: color.card, fontSize: 12 },
});
