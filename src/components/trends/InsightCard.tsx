import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { color, font } from '../../theme/tokens';
import Icon from '../ui/Icon';
import type { Insight, Nudge } from '../../types';

interface Props {
  insight?: Insight;
  nudge?: Nudge | null;
}

export default function InsightCard({ insight, nudge }: Props) {
  if (nudge) {
    return (
      <View style={[styles.card, styles.cardWarning]}>
        <View style={styles.iconRow}>
          <Text style={styles.emoji}>{nudge.emoji}</Text>
          <View style={styles.textWrap}>
            <Text style={styles.title}>{nudge.title}</Text>
            <Text style={styles.message}>{nudge.message}</Text>
          </View>
        </View>
      </View>
    );
  }

  if (!insight) return null;

  const isWarning = insight.type === 'warning';
  const isPositive = insight.type === 'positive';
  const iconName = isWarning ? 'alert-triangle' : isPositive ? 'check-circle' : 'info';
  const iconColor = isWarning ? color.clay : isPositive ? color.forest : color.gold;

  return (
    <View style={[styles.card, isWarning && styles.cardWarning, isPositive && styles.cardPositive]}>
      <View style={styles.iconRow}>
        <Icon name={iconName} size={18} color={iconColor} />
        <Text style={[styles.message, { marginLeft: 10 }]}>{insight.text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: color.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: color.line,
    padding: 14,
    marginBottom: 12,
  },
  cardWarning: {
    borderColor: color.clay + '40',
    backgroundColor: color.clayTint + '60',
  },
  cardPositive: {
    borderColor: color.forest + '20',
    backgroundColor: color.cream2,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  emoji: {
    fontSize: 18,
    marginRight: 10,
  },
  textWrap: {
    flex: 1,
  },
  title: {
    fontFamily: font.bodySemi,
    fontSize: 13,
    color: color.ink,
    marginBottom: 3,
  },
  message: {
    flex: 1,
    fontFamily: font.body,
    fontSize: 13,
    color: color.inkSoft,
    lineHeight: 18,
  },
});
