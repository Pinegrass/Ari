import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  Share,
  ScrollView,
  StyleSheet,
} from 'react-native';
import ScreenShell from '../components/ScreenShell';
import { useData } from '../context/DataContext';
import * as authApi from '../api/auth';
import { color, font } from '../theme/tokens';
import { useHaptics } from '../hooks/useHaptics';
import Button from '../components/ui/Button';
import AnimatedEntry from '../components/ui/AnimatedEntry';
import Icon from '../components/ui/Icon';

interface Props {
  onBack: () => void;
}

export default function ExportScreen({ onBack }: Props) {
  const { transactions } = useData();
  const haptics = useHaptics();
  const [exporting, setExporting] = useState(false);
  const [exportingFull, setExportingFull] = useState(false);

  const generateCSV = (): string => {
    const header = 'Date,Type,Category,Description,Amount,Note';
    const rows = transactions.map((t) =>
      [
        t.date,
        t.type,
        t.category,
        `"${(t.description || '').replace(/"/g, '""')}"`,
        t.type === 'income' ? t.amount : -t.amount,
        `"${(t.note || '').replace(/"/g, '""')}"`,
      ].join(',')
    );
    return [header, ...rows].join('\n');
  };

  const handleExport = async () => {
    if (transactions.length === 0) {
      Alert.alert('No Data', 'Add some transactions first to export.');
      return;
    }

    setExporting(true);
    haptics.light();

    try {
      const csv = generateCSV();
      const totalIncome = transactions
        .filter((t) => t.type === 'income')
        .reduce((s, t) => s + t.amount, 0);
      const totalExpenses = transactions
        .filter((t) => t.type === 'expense')
        .reduce((s, t) => s + t.amount, 0);

      const summary = `Ari - Transaction Export\n${transactions.length} transactions\nIncome: Rs.${totalIncome}\nExpenses: Rs.${totalExpenses}\nBalance: Rs.${totalIncome - totalExpenses}`;

      await Share.share({
        message: `${summary}\n\n--- CSV Data ---\n\n${csv}`,
        title: 'Ari Transactions Export',
      });

      haptics.success();
    } catch {
      Alert.alert('Export Failed', 'Could not export your data. Please try again.');
      haptics.error();
    } finally {
      setExporting(false);
    }
  };

  // Full account dump from the server (profile, budgets, goals, tax profile,
  // notes — not just transactions). This is the DPDP §11 / GDPR Art. 15+20
  // access + portability export promised in the privacy policy.
  const handleFullExport = async () => {
    setExportingFull(true);
    haptics.light();

    try {
      const data = await authApi.exportMyData();
      await Share.share({
        message: JSON.stringify(data, null, 2),
        title: 'Ari Full Data Export',
      });
      haptics.success();
    } catch {
      Alert.alert('Export Failed', 'Could not export your data. Please try again.');
      haptics.error();
    } finally {
      setExportingFull(false);
    }
  };

  return (
    <ScreenShell edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} accessibilityLabel="Go back" accessibilityRole="button">
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Export Data</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <AnimatedEntry delay={100}>
          <View style={styles.card}>
            <Icon name="pie-chart" size={48} color={color.forest} />
            <Text style={styles.cardTitle}>Export as CSV</Text>
            <Text style={styles.cardDesc}>
              Share your transaction data via text, email, or save it. Perfect for
              spreadsheets or backup.
            </Text>
            <Text style={styles.txnCount}>
              {transactions.length} transaction{transactions.length !== 1 ? 's' : ''} available
            </Text>
          </View>
        </AnimatedEntry>

        <AnimatedEntry delay={250}>
          <Button onPress={handleExport} loading={exporting} fullWidth accessibilityLabel="Export and share data" accessibilityRole="button">
            Export & Share
          </Button>
        </AnimatedEntry>

        <AnimatedEntry delay={350}>
          <View style={styles.card}>
            <Icon name="download" size={48} color={color.forest} />
            <Text style={styles.cardTitle}>Full Account Export</Text>
            <Text style={styles.cardDesc}>
              Everything we hold about you — profile, transactions, budgets,
              goals, tax profile, and notes — as one JSON file. This is the
              data-portability export from our privacy policy.
            </Text>
          </View>
        </AnimatedEntry>

        <AnimatedEntry delay={450}>
          <Button onPress={handleFullExport} loading={exportingFull} fullWidth accessibilityLabel="Export full account data" accessibilityRole="button">
            Export Everything (JSON)
          </Button>
        </AnimatedEntry>

        <AnimatedEntry delay={400}>
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              Your data stays on your device. We never sell or share your
              financial information.
            </Text>
          </View>
        </AnimatedEntry>
      </ScrollView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: color.line,
  },
  backText: { fontSize: 16, color: color.inkSoft, fontFamily: font.body },
  title: { fontSize: 17, fontFamily: font.bodyBold, color: color.ink },
  content: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 48, gap: 20 },
  card: {
    backgroundColor: color.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: color.line,
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  cardEmoji: { fontSize: 48 },
  cardTitle: { fontSize: 20, fontFamily: font.bodyBold, color: color.ink },
  cardDesc: {
    fontSize: 14,
    color: color.inkSoft,
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: font.body,
  },
  txnCount: {
    fontSize: 13,
    color: color.forest,
    fontFamily: font.bodySemi,
    marginTop: 4,
  },
  infoBox: {
    backgroundColor: color.cream2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: color.forest,
    padding: 16,
  },
  infoText: {
    fontSize: 13,
    color: color.inkSoft,
    textAlign: 'center',
    lineHeight: 18,
    fontFamily: font.body,
  },
});
