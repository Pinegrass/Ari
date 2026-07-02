import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  type ViewStyle,
  type ScrollViewProps,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { color } from '../theme/tokens';

interface ScreenShellProps {
  children: React.ReactNode;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  backgroundColor?: string;
  style?: ViewStyle;
  /** Wrap children in a ScrollView. Use false when the child is a FlatList/SectionList. */
  scrollable?: boolean;
  contentContainerStyle?: ViewStyle;
  scrollViewProps?: Omit<ScrollViewProps, 'contentContainerStyle'>;
  /** Extra bottom padding (e.g. for a floating FAB or tab bar). */
  bottomPad?: number;
}

/**
 * Consistent safe-area wrapper for every screen.
 *
 * Rules:
 *  - Default edges are ['top', 'bottom'] for stack/modal screens.
 *  - Tab screens should pass edges={['top']} and add their own bottom padding
 *    for the tab bar, because FlatList/SectionList contentContainerStyle is
 *    a better place for that padding.
 *  - Keep the wrapper thin: list screens manage their own ScrollView
 *    replacement; simple screens can set scrollable=true.
 */
export default function ScreenShell({
  children,
  edges = ['top', 'bottom'],
  backgroundColor = color.cream,
  style,
  scrollable = false,
  contentContainerStyle,
  scrollViewProps,
  bottomPad = 0,
}: ScreenShellProps) {
  return (
    <SafeAreaView style={[{ flex: 1, backgroundColor }, style]} edges={edges}>
      {scrollable ? (
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: bottomPad },
            contentContainerStyle,
          ]}
          {...scrollViewProps}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1, paddingBottom: bottomPad }, contentContainerStyle]}>
          {children}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
});

/**
 * Standard bottom padding values.
 */
export const bottomPad = {
  /** Padding for a tab screen so content isn't hidden by the bottom tab bar. */
  tab: (insets: { bottom: number }) => 60 + insets.bottom + 80,
  /** Padding for a screen with a floating FAB. */
  fab: (insets: { bottom: number }) => 60 + insets.bottom + 80,
};
