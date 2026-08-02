import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  Share,
  StyleSheet,
} from 'react-native';
import ScreenShell from '../components/ScreenShell';
import { useData } from '../context/DataContext';
import { getPnlReport } from '../api/reports';
import { buildPnlCsv, buildTransactionsCsv, saveOrShareCsv } from '../utils/exportCsv';
import { color, font } from '../theme/tokens';
import { useHaptics } from '../hooks/useHaptics';
import Button from '../components/ui/Button';
import AnimatedEntry from '../components/ui/AnimatedEntry';
import Icon from '../components/ui/Icon';

interface Props {
  onBack: () => void;
}

const PNL_MONTHS = 12;

export default function ExportScreen({ onBack }: Props) {
  const { transactions } = useData();
  const haptics = useHaptics();
  const [exporting, setExporting] = useState<'transactions' | 'pnl' | null>(null);

  const today = () => new Date().toISOString().slice(0, 10);

  const deliverCsv = async (filename: string, csv: string, fallbackTitle: string) => {
    try {
      const outcome = await saveOrShareCsv(filename, csv);
      if (outcome === 'saved') {
        Alert.alert('Export Complete', `${filename} saved. Open it in Excel or Sheets.`);
      }
      if (outcome !== 'cancelled') haptics.success();
    } catch {
      // File delivery unavailable (rare) — fall back to sharing the raw CSV text.
      await Share.share({ message: csv, title: fallbackTitle });
      haptics.success();
    }
  };

  const handleExportTransactions = async () => {
    if (transactions.length === 0) {
      Alert.alert('No Data', 'Add some transactions first to export.');
      return;
    }

    setExporting('transactions');
    haptics.light();
    try {
      await deliverCsv(
        `ari-transactions-${today()}.csv`,
        buildTransactionsCsv(transactions),
        'Ari Transactions Export'
      );
    } catch {
      Alert.alert('Export Failed', 'Could not export your data. Please try again.');
      haptics.error();
    } finally {
      setExporting(null);
    }
  };

  const handleExportPnl = async () => {
    setExporting('pnl');
    haptics.light();
    try {
      const report = await getPnlReport(PNL_MONTHS);
      if (!report.months.length) {
        Alert.alert('No Data', 'Add some transactions first to build a P&L report.');
        return;
      }
      await deliverCsv(`ari-pnl-${today()}.csv`, buildPnlCsv(report), 'Ari P&L Export');
    } catch {
      Alert.alert('Export Failed', 'Could not build your P&L report. Check your connection and try again.');
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

      <View style={styles.content}>
        <AnimatedEntry delay={100}>
          <View style={styles.card}>
            <Icon name="pie-chart" size={48} color={color.forest} />
            <Text style={styles.cardTitle}>Export as CSV</Text>
            <Text style={styles.cardDesc}>
              Save a spreadsheet-ready file of your transactions, or a P&L
              statement for the last {PNL_MONTHS} months — handy at tax time.
            </Text>
            <Text style={styles.txnCount}>
              {transactions.length} transaction{transactions.length !== 1 ? 's' : ''} available
            </Text>
          </View>
        </AnimatedEntry>

        <AnimatedEntry delay={250}>
          <Button
            onPress={handleExportTransactions}
            loading={exporting === 'transactions'}
            disabled={exporting !== null}
            fullWidth
            accessibilityLabel="Export transactions as CSV"
            accessibilityRole="button"
          >
            Export Transactions (CSV)
          </Button>
        </AnimatedEntry>

        <AnimatedEntry delay={350}>
          <Button
            onPress={handleExportPnl}
            loading={exporting === 'pnl'}
            disabled={exporting !== null}
            variant="secondary"
            fullWidth
            accessibilityLabel="Export profit and loss report as CSV"
            accessibilityRole="button"
          >
            Export P&L Report (CSV)
          </Button>
        </AnimatedEntry>

        <AnimatedEntry delay={450}>
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              Your data stays on your device. We never sell or share your
              financial information.
            </Text>
          </View>
        </AnimatedEntry>
      </View>
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
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 24, gap: 20 },
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
