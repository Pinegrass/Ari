import React, { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { getEngagementSummary, type EngagementSummary } from '../api/engagement';
import type { MainStackParamList } from '../navigation/navigationTypes';
import { color, font, type } from '../theme/tokens';
import Icon from './ui/Icon';
import ProgressBar from './ui/ProgressBar';
import { track } from '../lib/analytics';

type Nav = StackNavigationProp<MainStackParamList>;

export default function EngagementCard() {
  const navigation = useNavigation<Nav>();
  const [summary, setSummary] = useState<EngagementSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    let mounted = true;
    getEngagementSummary()
      .then((value) => mounted && setSummary(value))
      .catch(() => {})
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []));

  if (loading) {
    return <View style={styles.card}><ActivityIndicator color={color.forest} /></View>;
  }
  if (!summary) return null;

  const open = () => {
    track('engagement_card_opened', { lifecycle: summary.lifecycle, action: summary.recommendedAction });
    if (summary.recommendedAction === 'open_report') navigation.navigate('PeriodicReports');
    else navigation.navigate('AddTransaction', { type: 'expense' });
  };

  return (
    <View style={styles.card}>
      <View style={styles.headingRow}>
        <View style={styles.icon}><Icon name="sprout" size={20} color={color.forest} /></View>
        <View style={styles.headingText}>
          <Text style={styles.kicker}>Your rhythm</Text>
          <Text style={styles.title}>{summary.headline}</Text>
        </View>
      </View>
      <View style={styles.metrics}>
        <View><Text style={styles.metricValue}>{summary.currentStreak}</Text><Text style={styles.metricLabel}>day streak</Text></View>
        <View style={styles.divider} />
        <View><Text style={styles.metricValue}>{summary.transactionCount}</Text><Text style={styles.metricLabel}>entries logged</Text></View>
      </View>
      <View style={styles.progressHead}>
        <Text style={styles.progressLabel}>Next milestone</Text>
        <Text style={styles.progressValue}>{summary.transactionCount}/{summary.nextMilestone}</Text>
      </View>
      <ProgressBar percentage={summary.milestoneProgress * 100} height={7} />
      <TouchableOpacity style={styles.action} onPress={open} accessibilityRole="button">
        <Text style={styles.actionText}>
          {summary.recommendedAction === 'open_report' ? 'See my report' : 'Log one small update'}
        </Text>
        <Icon name="chevron-right" size={17} color={color.card} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: 22, backgroundColor: color.card, borderWidth: 1, borderColor: color.line, borderRadius: 22, padding: 18 },
  headingRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  icon: { width: 40, height: 40, borderRadius: 13, backgroundColor: color.cream2, alignItems: 'center', justifyContent: 'center' },
  headingText: { flex: 1 },
  kicker: { fontFamily: font.bodyBold, fontSize: type.eyebrow, color: color.moss, letterSpacing: 1.4, textTransform: 'uppercase' },
  title: { fontFamily: font.displaySemi, fontSize: 17, color: color.forestDeep, marginTop: 3 },
  metrics: { flexDirection: 'row', marginTop: 18, marginBottom: 16, gap: 18, alignItems: 'center' },
  metricValue: { fontFamily: font.displayBold, fontSize: 24, color: color.forest },
  metricLabel: { fontFamily: font.body, fontSize: 11, color: color.inkSoft },
  divider: { width: 1, height: 34, backgroundColor: color.line },
  progressHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 7 },
  progressLabel: { fontFamily: font.bodyMed, fontSize: 11, color: color.inkSoft },
  progressValue: { fontFamily: font.bodySemi, fontSize: 11, color: color.forest },
  action: { marginTop: 16, backgroundColor: color.forest, borderRadius: 14, paddingVertical: 13, paddingHorizontal: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  actionText: { fontFamily: font.bodySemi, fontSize: 13, color: color.card },
});
