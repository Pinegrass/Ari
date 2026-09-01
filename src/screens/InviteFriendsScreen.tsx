import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Share, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import ScreenShell from '../components/ScreenShell';
import Icon from '../components/ui/Icon';
import ProgressBar from '../components/ui/ProgressBar';
import { getReferralStatus, recordReferralShare, redeemReferral, type ReferralStatus } from '../api/engagement';
import { ApiError } from '../api/client';
import { useHaptics } from '../hooks/useHaptics';
import { track } from '../lib/analytics';
import { color, font, type } from '../theme/tokens';
import type { MainStackParamList } from '../navigation/navigationTypes';

export default function InviteFriendsScreen() {
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
    const result = await Share.share({
      title: 'Try Ari with me',
      message: `I use Ari for calm money tracking and visual reports. Join me with code ${status.code}: ${status.inviteUrl}`,
      url: status.inviteUrl,
    });
    if (result.action !== Share.dismissedAction) {
      await recordReferralShare().catch(() => null);
      track('referral_shared', { channel: result.activityType ?? 'system_share' });
      setStatus((value) => value ? { ...value, shares: value.shares + 1 } : value);
      haptics.success();
    }
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
      Alert.alert('Invite applied', `${response.inviterName} is now credited for welcoming you to Ari.`);
    } catch (error) {
      haptics.error();
      Alert.alert('Could not apply code', error instanceof ApiError ? error.message : 'Try again in a moment.');
    } finally {
      setRedeeming(false);
    }
  };

  return (
    <ScreenShell edges={['top']} scrollable contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back} accessibilityLabel="Go back"><Icon name="arrow-left" size={22} /></TouchableOpacity>
        <View><Text style={styles.headerTitle}>Grow your circle</Text><Text style={styles.headerSub}>Invite people without pressure or spam</Text></View>
      </View>

      {loading ? <ActivityIndicator style={styles.loader} color={color.forest} size="large" /> : status && (
        <>
          <View style={styles.hero}>
            <View style={styles.gift}><Icon name="gift" size={28} color={color.card} /></View>
            <Text style={styles.heroTitle}>Money habits are easier together</Text>
            <Text style={styles.heroBody}>Share Ari when it feels useful. Your friend chooses whether to join and apply your code.</Text>
            <View style={styles.codeBox}><Text style={styles.codeLabel}>Your invite code</Text><Text style={styles.code}>{status.code}</Text></View>
            <TouchableOpacity style={styles.shareButton} onPress={() => void share()} accessibilityRole="button">
              <Icon name="share" size={18} color={color.forest} /><Text style={styles.shareText}>Invite a friend</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <View style={styles.row}><Text style={styles.sectionTitle}>Circle progress</Text><Text style={styles.progressCount}>{status.accepted}/{status.nextGoal}</Text></View>
            <ProgressBar percentage={status.progress * 100} height={9} />
            <View style={styles.stats}>
              <View><Text style={styles.statValue}>{status.accepted}</Text><Text style={styles.statLabel}>joined</Text></View>
              <View style={styles.divider} />
              <View><Text style={styles.statValue}>{status.shares}</Text><Text style={styles.statLabel}>shares</Text></View>
              <View style={styles.divider} />
              <View><Text style={styles.statValue}>{status.badge ? '✓' : '—'}</Text><Text style={styles.statLabel}>circle badge</Text></View>
            </View>
            <Text style={styles.hint}>{status.nextGoal - status.accepted} more accepted {status.nextGoal - status.accepted === 1 ? 'invite' : 'invites'} to reach the next circle milestone.</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Were you invited?</Text>
            <Text style={styles.body}>Apply a friend’s code once. It credits the welcome; it never exposes your financial data.</Text>
            <View style={styles.redeemRow}>
              <TextInput value={code} onChangeText={setCode} autoCapitalize="characters" placeholder="ARI123ABC" placeholderTextColor={color.inkFaint} style={styles.input} accessibilityLabel="Invite code" />
              <TouchableOpacity style={styles.apply} onPress={() => void redeem()} disabled={redeeming || !code.trim()}>
                {redeeming ? <ActivityIndicator color={color.card} /> : <Text style={styles.applyText}>Apply</Text>}
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
