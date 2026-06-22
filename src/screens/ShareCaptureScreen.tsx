import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RouteProp } from '@react-navigation/native';
import { color, font } from '../theme/tokens';
import { parseExpenseAI } from '../api/parse';
import { useData } from '../context/DataContext';
import { formatCurrency } from '../utils/formatCurrency';
import { todayISO } from '../utils/dateHelpers';
import type { MainStackParamList } from '../navigation/navigationTypes';

type Props = {
  navigation: StackNavigationProp<MainStackParamList, 'ShareCapture'>;
  route: RouteProp<MainStackParamList, 'ShareCapture'>;
};

export default function ShareCaptureScreen({ navigation, route }: Props) {
  const { text } = route.params;
  const insets = useSafeAreaInsets();
  const { addTransaction } = useData();

  const [loading, setLoading] = useState(true);
  const [parsed, setParsed] = useState<Awaited<ReturnType<typeof parseExpenseAI>> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    parseExpenseAI(text)
      .then(setParsed)
      .catch(() => setError('Could not parse — add manually'))
      .finally(() => setLoading(false));
  }, [text]);

  // amount === 0 means the AI couldn't extract a number — route to manual entry.
  const amountUnknown = !parsed || parsed.amount === 0;

  const handleAddNow = async () => {
    if (!parsed || amountUnknown) return;
    setSaving(true);
    try {
      await addTransaction({
        type: parsed.type,
        amount: Math.round(parsed.amount),
        category: parsed.category,
        description: parsed.description,
        note: '',
        date: todayISO(),
        parseSource: 'ai',
        confidence: parsed.confidence,
        merchant: parsed.merchant,
        rawInput: text,
      });
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  };

  const handleEditFirst = () => {
    navigation.replace('AddTransaction', {
      type: parsed?.type ?? 'expense',
      prefill: {
        amount: parsed && parsed.amount > 0 ? parsed.amount : undefined,
        description: parsed?.description ?? text.slice(0, 80),
        category: parsed?.category,
      },
    });
  };

  const handleManual = () => {
    navigation.replace('AddTransaction', {
      type: 'expense',
      prefill: { description: text.slice(0, 80) },
    });
  };

  return (
    <View style={[styles.backdrop, { paddingBottom: insets.bottom }]}>
      <TouchableOpacity style={styles.dimmer} activeOpacity={1} onPress={navigation.goBack} />
      <View style={styles.sheet}>
        <View style={styles.handle} />

        <Text style={styles.heading}>SMS Capture</Text>

        {/* Raw text preview */}
        <ScrollView style={styles.rawBox} showsVerticalScrollIndicator={false}>
          <Text style={styles.rawText} numberOfLines={4}>
            {text}
          </Text>
        </ScrollView>

        {loading && (
          <View style={styles.stateRow}>
            <ActivityIndicator color={color.forest} />
            <Text style={styles.stateText}>Parsing with AI…</Text>
          </View>
        )}

        {!loading && error && (
          <>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.btnClay} onPress={handleManual} activeOpacity={0.85}>
              <Text style={styles.btnClayText}>Add manually</Text>
            </TouchableOpacity>
          </>
        )}

        {!loading && parsed && (
          <>
            <View style={styles.parsedRow}>
              <View>
                <Text style={styles.parsedLabel}>
                  {parsed.type === 'expense' ? 'Spent' : 'Received'}
                </Text>
                <Text style={styles.parsedAmount}>
                  {parsed.amount > 0 ? formatCurrency(parsed.amount) : '—'}
                </Text>
              </View>
              <View style={styles.parsedRight}>
                <Text style={styles.parsedDesc} numberOfLines={2}>
                  {parsed.description}
                </Text>
                <Text style={styles.parsedCategory}>{parsed.category}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.btnForest, (saving || amountUnknown) && styles.btnDisabled]}
              onPress={handleAddNow}
              activeOpacity={0.85}
              disabled={saving || amountUnknown}
            >
              {saving ? (
                <ActivityIndicator color={color.cream} />
              ) : (
                <Text style={styles.btnForestText}>Add entry</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnGhost} onPress={handleEditFirst} activeOpacity={0.8}>
              <Text style={styles.btnGhostText}>Edit first</Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity style={styles.cancel} onPress={navigation.goBack} activeOpacity={0.7}>
          <Text style={styles.cancelText}>Dismiss</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  dimmer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(35,41,31,0.55)',
  },
  sheet: {
    backgroundColor: color.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingTop: 12,
    gap: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: color.line,
    alignSelf: 'center',
    marginBottom: 8,
  },
  heading: {
    fontFamily: font.displayBold,
    fontSize: 18,
    color: color.ink,
  },
  rawBox: {
    backgroundColor: color.cream2,
    borderRadius: 10,
    padding: 12,
    maxHeight: 80,
  },
  rawText: {
    fontFamily: font.body,
    fontSize: 13,
    color: color.inkSoft,
    lineHeight: 18,
  },
  stateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  stateText: {
    fontFamily: font.body,
    fontSize: 14,
    color: color.inkSoft,
  },
  errorText: {
    fontFamily: font.body,
    fontSize: 14,
    color: color.clay,
  },
  parsedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: color.cream2,
    borderRadius: 14,
    padding: 16,
  },
  parsedLabel: {
    fontFamily: font.bodyMed,
    fontSize: 11,
    color: color.inkFaint,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  parsedAmount: {
    fontFamily: font.displayBold,
    fontSize: 22,
    color: color.ink,
  },
  parsedRight: {
    flex: 1,
    marginLeft: 16,
    alignItems: 'flex-end',
  },
  parsedDesc: {
    fontFamily: font.bodyMed,
    fontSize: 14,
    color: color.ink,
    textAlign: 'right',
  },
  parsedCategory: {
    fontFamily: font.body,
    fontSize: 12,
    color: color.inkSoft,
    marginTop: 2,
  },
  btnForest: {
    backgroundColor: color.forest,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.6 },
  btnForestText: {
    fontFamily: font.bodyBold,
    fontSize: 15,
    color: color.cream,
  },
  btnGhost: {
    borderWidth: 1,
    borderColor: color.line,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
  },
  btnGhostText: {
    fontFamily: font.bodyMed,
    fontSize: 15,
    color: color.ink,
  },
  btnClay: {
    backgroundColor: color.clay,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  btnClayText: {
    fontFamily: font.bodyBold,
    fontSize: 15,
    color: color.cream,
  },
  cancel: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  cancelText: {
    fontFamily: font.body,
    fontSize: 13,
    color: color.inkFaint,
  },
});
