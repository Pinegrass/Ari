import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from './ui/Icon';
import { color, font } from '../theme/tokens';
import type { ChatMessage } from '../types';

interface Props {
  message: ChatMessage;
  reportLabel?: string;
  onReport?: () => void;
}

export default function ChatBubble({ message, reportLabel, onReport }: Props) {
  const isUser = message.role === 'user';

  return (
    <View style={[styles.row, isUser && styles.rowUser]}>
      {!isUser && (
        <View style={styles.avatar}>
          <Icon name="bot" size={16} color={color.forest} />
        </View>
      )}
      <View
        style={[
          styles.bubble,
          isUser ? styles.bubbleUser : styles.bubbleTomo,
        ]}
      >
        <Text style={[styles.text, isUser && styles.textUser]}>
          {message.content}
        </Text>
        {!isUser && onReport && (
          <TouchableOpacity accessibilityRole="button" onPress={onReport} style={styles.reportButton}>
            <Text style={styles.reportText}>{reportLabel}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  rowUser: {
    flexDirection: 'row-reverse',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: color.cream2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: color.line,
  },
  bubble: {
    maxWidth: '75%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleTomo: {
    backgroundColor: color.card,
    borderWidth: 1,
    borderColor: color.line,
    borderBottomLeftRadius: 4,
  },
  bubbleUser: {
    backgroundColor: color.forest,
    borderBottomRightRadius: 4,
  },
  text: {
    fontFamily: font.body,
    fontSize: 14,
    color: color.ink,
    lineHeight: 20,
  },
  reportButton: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' },
  reportText: { fontSize: 12, color: color.forest },
  textUser: {
    color: color.cream,
    fontFamily: font.bodyMed,
  },
});
