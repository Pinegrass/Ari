import {useLanguage as useCopyLanguage} from '../i18n/LanguageContext';
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
import { exportCopy } from '../i18n/exportCopy';
import { requestSessionRevision } from '../lib/requestSession';

interface Props {
  onBack: () => void;
}

export default function ExportScreen({ onBack }: Props) {
 const {phrase:localizeCopy,language}=useCopyLanguage();
 const copy = exportCopy[language];
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
    const revision = requestSessionRevision();
    try {
      const outcome = await saveOrShareFile(filename, contents, mimeType);
      if (requestSessionRevision() !== revision) return;
      if (outcome === 'saved') {
        Alert.alert(copy.complete, `${filename}\n${copy.saved}`);
      }
      if (outcome !== 'cancelled') haptics.success();
    } catch {
      if (requestSessionRevision() !== revision) throw new Error('Export account changed');
      await Share.share({ message: contents, title: fallbackTitle });
      haptics.success();
    }
  };

  const handleExport = async () => {
    if (transactions.length === 0) {
      Alert.alert(copy.noData, copy.addEntries);
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
      Alert.alert(copy.failed, copy.retry);
      haptics.error();
    } finally {
      setExporting(null);
    }
  };

  const handlePnlExport = async () => {
    const revision = requestSessionRevision();
    setExporting('pnl');
    haptics.light();
    try {
      const report = await getPnlReport(12);
      if (requestSessionRevision() !== revision) throw new Error('Export account changed');
      if (report.months.length === 0) {
        Alert.alert(copy.noData, copy.addEntries);
        return;
      }
      await deliverFile(
        `ari-pnl-${today()}.csv`,
        buildPnlCsv(report),
        'text/csv',
        'Ari P&L Export',
      );
    } catch {
      Alert.alert(copy.failed, copy.retry);
      haptics.error();
    } finally {
      setExporting(null);
    }
  };

  // Explicitly scoped server records plus current-device account-owned bills.
  const handleFullExport = async () => {
    const revision = requestSessionRevision();
    setExporting('full');
    haptics.light();

    try {
      const data = await authApi.exportMyData();
      if (requestSessionRevision() !== revision) throw new Error('Export account changed');
      await deliverFile(
        `ari-account-and-bills-${today()}.json`,
        JSON.stringify(data, null, 2),
        'application/json',
        copy.accountTitle,
      );
    } catch {
      Alert.alert(copy.failed, copy.retry);
      haptics.error();
    } finally {
      setExporting(null);
    }
  };

  return (
    <ScreenShell edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} accessibilityLabel={localizeCopy("Go back")} accessibilityRole="button">
          <Text style={styles.backText}>{localizeCopy("← Back")}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{copy.title}</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <AnimatedEntry delay={100}>
          <View style={styles.card}>
            <Icon name="pie-chart" size={48} color={color.forest} />
            <Text style={styles.cardTitle}>{copy.csv}</Text>
            <Text style={styles.cardDesc}>
              {copy.csvHelp}
            </Text>
            <Text style={styles.txnCount}>
              {copy.transactionCount}: {transactions.length}
            </Text>
          </View>
        </AnimatedEntry>

        <AnimatedEntry delay={250}>
          <Button onPress={handleExport} loading={exporting === 'transactions'} disabled={exporting !== null} fullWidth accessibilityLabel={copy.transactionButton} accessibilityRole="button">
            {copy.transactionButton}
          </Button>
        </AnimatedEntry>

        <AnimatedEntry delay={325}>
          <Button onPress={handlePnlExport} loading={exporting === 'pnl'} disabled={exporting !== null} variant="secondary" fullWidth accessibilityLabel={copy.pnlButton} accessibilityRole="button">
            {copy.pnlButton}
          </Button>
        </AnimatedEntry>

        <AnimatedEntry delay={350}>
          <View style={styles.card}>
            <Icon name="download" size={48} color={color.forest} />
            <Text style={styles.cardTitle}>{copy.accountTitle}</Text>
            <Text style={styles.cardDesc}>
              {copy.accountHelp}
            </Text>
          </View>
        </AnimatedEntry>

        <AnimatedEntry delay={450}>
          <Button onPress={handleFullExport} loading={exporting === 'full'} disabled={exporting !== null} fullWidth accessibilityLabel={copy.accountButton} accessibilityRole="button">
            {copy.accountButton}
          </Button>
        </AnimatedEntry>

        <AnimatedEntry delay={400}>
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              {copy.fileWarning}
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
