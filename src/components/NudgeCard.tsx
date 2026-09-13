import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { color, font, type } from '../theme/tokens';
import Icon from './ui/Icon';
import type { Nudge } from '../types';
import { useLanguage } from '../i18n/LanguageContext';

interface Props {
  nudge: Nudge;
  /** Tap opens Tomo chat so the user can act on the nudge. */
  onPress?: () => void;
  /** Autonomy-preserving 24-hour dismissal. */
  onDismiss?: () => void;
  compact?: boolean;
}

/**
 * Tomo nudge card on the Dashboard. Styling matches the other dashboard
 * cards (flat `card` surface, hairline border, 22 radius — see
 * CoachingBriefCard); a chevron hints that tapping opens the Tomo tab.
 */
export default function NudgeCard({ nudge, onPress, onDismiss, compact = false }: Props) {
  const { t } = useLanguage();
  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.main}
        onPress={onPress}
        activeOpacity={onPress ? 0.8 : 1}
        disabled={!onPress}
        accessibilityRole={onPress ? 'button' : undefined}
        accessibilityLabel={`${t('homeTomoNoticed')}: ${nudge.title}`}
      >
        <View style={styles.header}>
          {nudge.emoji ? (
            <Text style={styles.emoji}>{nudge.emoji}</Text>
          ) : (
            <Icon name="zap" size={20} color={color.forest} />
          )}
          <Text style={styles.badgeText}>{t('homeTomoNoticed')}</Text>
          <View style={styles.spacer} />
          {onPress ? <Icon name="chevron-right" size={16} color={color.inkFaint} /> : null}
        </View>
        <Text style={styles.title} numberOfLines={compact ? 2 : undefined}>{nudge.title}</Text>
        {!compact && <Text style={styles.message}>{nudge.message}</Text>}
      </TouchableOpacity>
      {onDismiss ? (
        <TouchableOpacity
          style={styles.dismiss}
          onPress={onDismiss}
          accessibilityRole="button"
          accessibilityLabel={t('homeDismissNudge')}
        >
          <Text style={styles.dismissText}>{t('homeNotNow')}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
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
    overflow: 'hidden',
  },
  main: { padding: 18 },
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
  dismiss: {
    borderTopWidth: 1,
    borderTopColor: color.line,
    paddingHorizontal: 18,
    paddingVertical: 11,
    alignItems: 'flex-end',
  },
  dismissText: {
    fontFamily: font.bodySemi,
    fontSize: type.caption,
    color: color.moss,
  },
});
