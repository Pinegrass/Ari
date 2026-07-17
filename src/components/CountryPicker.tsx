import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, Modal, FlatList,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import Icon from './ui/Icon';
import { color, font } from '../theme/tokens';
import * as localesApi from '../api/locales';
import type { LocaleInfo } from '../utils/locale';
import { getLocale, SUPPORTED_COUNTRIES } from '../utils/locale';

interface Props {
  value: string;          // current country code
  onChange: (code: string) => void;
  /** Optional: show only a compact flag+code pill instead of full name */
  compact?: boolean;
}

export default function CountryPicker({ value, onChange, compact }: Props) {
  const [visible, setVisible] = useState(false);
  const [locales, setLocales] = useState<LocaleInfo[]>(() =>
    SUPPORTED_COUNTRIES.map((c) => getLocale(c))
  );

  useEffect(() => {
    // Fetch full list from backend (gets any newly added countries)
    localesApi.getSupportedLocales().then(setLocales).catch(() => {
      // Fallback to the built-in list — already loaded above
    });
  }, []);

  const current = getLocale(value);

  if (compact) {
    return (
      <>
        <TouchableOpacity
          style={styles.compactPill}
          onPress={() => setVisible(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.compactText}>
            {current.name} ({current.symbol})
          </Text>
          <Icon name="chevron-down" size={14} color={color.inkFaint} />
        </TouchableOpacity>
        <CountryModal
          visible={visible}
          locales={locales}
          selected={value}
          onSelect={(c) => { onChange(c); setVisible(false); }}
          onClose={() => setVisible(false)}
        />
      </>
    );
  }

  return (
    <>
      <TouchableOpacity
        style={styles.fullPicker}
        onPress={() => setVisible(true)}
        activeOpacity={0.7}
      >
        <Text style={styles.fullLabel}>Country</Text>
        <View style={styles.fullRow}>
          <Text style={styles.fullValue}>{current.name}</Text>
          <Text style={styles.fullCurrency}>
            {current.currency} ({current.symbol})
          </Text>
          <Icon name="chevron-down" size={16} color={color.inkFaint} />
        </View>
      </TouchableOpacity>
      <CountryModal
        visible={visible}
        locales={locales}
        selected={value}
        onSelect={(c) => { onChange(c); setVisible(false); }}
        onClose={() => setVisible(false)}
      />
    </>
  );
}

function CountryModal({
  visible, locales, selected, onSelect, onClose,
}: {
  visible: boolean;
  locales: LocaleInfo[];
  selected: string;
  onSelect: (code: string) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Select your country</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Icon name="x" size={20} color={color.inkFaint} />
            </TouchableOpacity>
          </View>

          {locales.length === 0 ? (
            <ActivityIndicator style={{ marginTop: 40 }} color={color.forest} />
          ) : (
            <FlatList
              data={locales}
              keyExtractor={(l) => l.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.countryRow,
                    item.code === selected && styles.countryRowActive,
                  ]}
                  onPress={() => onSelect(item.code)}
                  activeOpacity={0.7}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.countryName}>{item.name}</Text>
                    <Text style={styles.countryMeta}>
                      {item.currency} ({item.symbol})
                    </Text>
                  </View>
                  {item.code === selected && (
                    <Icon name="check-circle" size={20} color={color.forest} />
                  )}
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.listContent}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  compactPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: color.cream2, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 6,
    borderWidth: 1, borderColor: color.line,
  },
  compactText: { fontSize: 13, fontFamily: font.bodySemi, color: color.ink },

  fullPicker: {
    backgroundColor: color.card, borderRadius: 14,
    padding: 14, borderWidth: 1, borderColor: color.line,
  },
  fullLabel: { fontSize: 12, fontFamily: font.body, color: color.inkSoft, marginBottom: 6 },
  fullRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  fullValue: { fontSize: 16, fontFamily: font.bodySemi, color: color.ink, flex: 1 },
  fullCurrency: { fontSize: 13, color: color.inkFaint, fontFamily: font.body },

  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: color.card,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '65%', minHeight: 260,
  },
  sheetHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderColor: color.line,
  },
  sheetTitle: { fontSize: 17, fontFamily: font.bodyBold, color: color.ink, flex: 1 },
  closeBtn: { padding: 4 },
  listContent: { paddingHorizontal: 12, paddingBottom: 24 },
  countryRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: 12,
    borderRadius: 12, marginTop: 4,
  },
  countryRowActive: {
    backgroundColor: color.cream2,
  },
  countryName: { fontSize: 15, fontFamily: font.bodySemi, color: color.ink },
  countryMeta: { fontSize: 12, color: color.inkFaint, marginTop: 2, fontFamily: font.body },
});
