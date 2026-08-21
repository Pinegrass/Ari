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
import { getPnlReport } from '../api/reports';
import { buildPnlCsv, buildTransactionsCsv, saveOrShareFile } from '../utils/exportFiles';
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
  const [exporting, setExporting] = useState<'transactions' | 'pnl' | 'full' | null>(null);

  const today = () => new Date().toISOString().slice(0, 10);

  const deliverFile = async (
    filename: string,
    contents: string,
    mimeType: string,
    fallbackTitle: string,
  ) => {
    try {
      const outcome = await saveOrShareFile(filename, contents, mimeType);
      if (outcome === 'saved') {
        Alert.alert('Export Complete', `${filename} saved. Open it in Excel, Sheets, or Files.`);
      }
      if (outcome !== 'cancelled') haptics.success();
    } catch {
      await Share.share({ message: contents, title: fallbackTitle });
      haptics.success();
    }
  };

  const handleExport = async () => {
    if (transactions.length === 0) {
      Alert.alert('No Data', 'Add some transactions first to export.');
      return;
    }

    setExporting('transactions');
    haptics.light();

    try {
      await deliverFile(
        `ari-transactions-${today()}.csv`,
        buildTransactionsCsv(transactions),
        'text/csv',
        'Ari Transactions Export',
      );
    } catch {
      Alert.alert('Export Failed', 'Could not export your data. Please try again.');
      haptics.error();
    } finally {
      setExporting(null);
    }
  };

  const handlePnlExport = async () => {
    setExporting('pnl');
    haptics.light();
    try {
      const report = await getPnlReport(12);
      if (report.months.length === 0) {
        Alert.alert('No Data', 'Add some transactions first to build a P&L report.');
        return;
      }
      await deliverFile(
        `ari-pnl-${today()}.csv`,
        buildPnlCsv(report),
        'text/csv',
        'Ari P&L Export',
      );
    } catch {
      Alert.alert('Export Failed', 'Could not build your P&L report. Check your connection and try again.');
      haptics.error();
    } finally {
      setExporting(null);
    }
  };

  // Full account dump from the server (profile, budgets, goals, tax profile,
  // notes — not just transactions). This is the DPDP §11 / GDPR Art. 15+20
  // access + portability export promised in the privacy policy.
  const handleFullExport = async () => {
    setExporting('full');
    haptics.light();

    try {
      const data = await authApi.exportMyData();
      await deliverFile(
        `ari-full-export-${today()}.json`,
        JSON.stringify(data, null, 2),
        'application/json',
        'Ari Full Data Export',
      );
    } catch {
      Alert.alert('Export Failed', 'Could not export your data. Please try again.');
      haptics.error();
    } finally {
      setExporting(null);
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
              Save spreadsheet-ready transaction data or a 12-month P&L report.
            </Text>
            <Text style={styles.txnCount}>
              {transactions.length} transaction{transactions.length !== 1 ? 's' : ''} available
            </Text>
          </View>
        </AnimatedEntry>

        <AnimatedEntry delay={250}>
          <Button onPress={handleExport} loading={exporting === 'transactions'} disabled={exporting !== null} fullWidth accessibilityLabel="Export transactions as CSV" accessibilityRole="button">
            Export Transactions (CSV)
          </Button>
        </AnimatedEntry>

        <AnimatedEntry delay={325}>
          <Button onPress={handlePnlExport} loading={exporting === 'pnl'} disabled={exporting !== null} variant="secondary" fullWidth accessibilityLabel="Export profit and loss report as CSV" accessibilityRole="button">
            Export P&L Report (CSV)
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
          <Button onPress={handleFullExport} loading={exporting === 'full'} disabled={exporting !== null} fullWidth accessibilityLabel="Export full account data" accessibilityRole="button">
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
