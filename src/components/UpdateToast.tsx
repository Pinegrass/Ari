import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useOTAUpdates } from '../hooks/useOTAUpdates';
import { color, font } from '../theme/tokens';

/**
 * Non-blocking toast that appears when an OTA update has been staged.
 * Dismisses automatically after a few seconds.
 */
export default function UpdateToast() {
  const { status, message } = useOTAUpdates();
  const opacity = useState(new Animated.Value(0))[0];

  useEffect(() => {
    if (status === 'staged') {
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.delay(4500),
        Animated.timing(opacity, { toValue: 0, duration: 350, useNativeDriver: true }),
      ]).start();
    }
  }, [status, opacity]);

  if (status !== 'staged') return null;

  return (
    <Animated.View style={[styles.container, { opacity }]} pointerEvents="none">
      <View style={styles.bubble}>
        <Text style={styles.text}>{message}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 999,
  },
  bubble: {
    backgroundColor: color.forestDeep,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  text: {
    fontFamily: font.bodySemi,
    fontSize: 12,
    color: color.cream,
  },
});
