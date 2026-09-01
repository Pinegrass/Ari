import React, { useState, useCallback } from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';

import Icon from './ui/Icon';
import { color, font } from '../theme/tokens';
import { getStreakDays } from '../api/analytics';
import {
  computeStreaks,
  writeStreakCache,
  type StreakInfo,
} from '../lib/streaks';
import { useOfflineCache } from '../hooks/useOfflineCache';
import { useHaptics } from '../hooks/useHaptics';
import { todayISO } from '../utils/dateHelpers';
import type { TabParamList, MainStackParamList } from '../navigation/navigationTypes';

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Dashboard'>,
  StackNavigationProp<MainStackParamList>
>;

const CACHE_KEY = 'streak_days'; // useOfflineCache 30-min TTL, prefix added inside

/**
 * Compact streak pill for the Home header. Fetches the logged-day history
 * (30-min offline cache), computes the streak, and snapshots it to
 * `ari_streak_cache` so streak state remains available across app sessions.
 * Tap → Daily heatmap. Renders nothing until the user has a streak going,
 * so Home stays clean for brand-new users.
 */
export default function StreakChip() {
  const navigation = useNavigation<Nav>();
  const { fetchWithCache } = useOfflineCache();
  const haptics = useHaptics();
  const [streak, setStreak] = useState<StreakInfo | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        try {
          const data = await fetchWithCache(CACHE_KEY, getStreakDays);
          const info = computeStreaks(data.days, todayISO());
          await writeStreakCache(info); // consumed by useNotifications copy
          if (active) setStreak(info);
        } catch {
          // offline with no cache — stay hidden
        }
      })();
      return () => {
        active = false;
      };
    }, [fetchWithCache])
  );

  if (!streak || streak.current === 0) return null;

  const atRisk = !streak.loggedToday;

  return (
    <TouchableOpacity
      style={[styles.pill, atRisk && styles.pillAtRisk]}
      activeOpacity={0.85}
      onPress={() => {
        haptics.light();
        navigation.navigate('DailyHeatmap');
      }}
      accessibilityRole="button"
      accessibilityLabel={
        atRisk
          ? `${streak.current} day streak, log something today to keep it`
          : `${streak.current} day streak`
      }
    >
      <Icon name="zap" size={13} color={atRisk ? color.clay : color.gold} />
      <Text style={styles.text}>
        {streak.current} day{streak.current === 1 ? '' : 's'}
        {atRisk ? ' · log today' : ''}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: color.card,
    borderWidth: 1,
    borderColor: color.line,
  },
  pillAtRisk: {
    backgroundColor: color.clayTint,
    borderColor: color.clay,
  },
  text: { fontFamily: font.bodySemi, fontSize: 12, color: color.ink },
});
