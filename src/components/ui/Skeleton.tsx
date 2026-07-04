import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet, type ViewStyle, type DimensionValue } from 'react-native';
import { color } from '../../theme/tokens';

/**
 * Skeleton — a gentle pulsing placeholder for first-paint loading. JS-only
 * (Animated opacity loop, native driver), no shimmer-gradient dependency, so it
 * ships as an OTA update. Prefer this over a spinner on content-shaped screens:
 * it reserves layout and reads as "loading this thing" rather than a blank wait.
 */

interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  radius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width = '100%', height = 14, radius = 8, style }: SkeletonProps) {
  const pulse = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <Animated.View
      style={[
        { width, height, borderRadius: radius, backgroundColor: color.cream2, opacity: pulse },
        style,
      ]}
    />
  );
}

/** A skeleton shaped like a TransactionItem row (icon + two text lines + amount). */
export function SkeletonRow() {
  return (
    <View style={styles.row}>
      <Skeleton width={40} height={40} radius={20} />
      <View style={styles.rowText}>
        <Skeleton width="55%" height={13} />
        <Skeleton width="35%" height={11} style={{ marginTop: 7 }} />
      </View>
      <Skeleton width={56} height={15} />
    </View>
  );
}

/** A short stack of skeleton rows for a loading list. */
export function SkeletonList({ count = 4 }: { count?: number }) {
  return (
    <View>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </View>
  );
}

/** A skeleton block shaped like a card (used for chart/summary first paint). */
export function SkeletonCard({ height = 120 }: { height?: number }) {
  return <Skeleton width="100%" height={height} radius={16} style={styles.card} />;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: color.line,
  },
  rowText: { flex: 1 },
  card: { marginTop: 12 },
});
