import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { color, font, type } from '../theme/tokens';
import Icon from './ui/Icon';
import type { Nudge } from '../types';

interface Props {
  nudge: Nudge;
  /** Tap opens Tomo chat so the user can act on the nudge. */
  onPress?: () => void;
}

/**
 * Tomo nudge card on the Dashboard. Styling matches the other dashboard
 * cards (flat `card` surface, hairline border, 22 radius — see
 * CoachingBriefCard); a chevron hints that tapping opens the Tomo tab.
 */
export default function NudgeCard({ nudge, onPress }: Props) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={onPress ? 0.8 : 1}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`Tomo nudge: ${nudge.title}`}
    >
      <View style={styles.header}>
        {nudge.emoji ? (
          <Text style={styles.emoji}>{nudge.emoji}</Text>
        ) : (
          <Icon name="zap" size={20} color={color.forest} />
        )}
        <Text style={styles.badgeText}>Tomo says</Text>
        <View style={styles.spacer} />
        {onPress && <Icon name="chevron-right" size={16} color={color.inkFaint} />}
      </View>
      <Text style={styles.title}>{nudge.title}</Text>
      <Text style={styles.message}>{nudge.message}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 22,
    marginBottom: 16,
    backgroundColor: color.card,
    borderWidth: 1,
    borderColor: color.line,
    borderRadius: 22,
    padding: 18,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 10,
  },
  spacer: { flex: 1 },
  emoji: {
    fontSize: 22,
  },
  badgeText: {
    fontFamily: font.bodyBold,
    fontSize: 10,
    letterSpacing: 1.4,
    color: color.gold,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: font.bodyBold,
    fontSize: type.screenTitle,
    color: color.ink,
    marginBottom: 6,
  },
  message: {
    fontFamily: font.body,
    fontSize: type.body,
    color: color.inkSoft,
    lineHeight: 20,
  },
});
