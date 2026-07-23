import { Platform, Share } from 'react-native';
import type { PnlReport, Transaction } from '../types';

// CSV builders are pure so they can be unit-tested; file/share IO lives in
// saveOrShareCsv below. Amounts are plain integers (no ₹ symbol, no grouping)
// so Excel/Sheets parse them as numbers; signs follow accounting convention
// (expenses negative).

const escapeCell = (value: string): string => `"${value.replace(/"/g, '""')}"`;

export function buildTransactionsCsv(transactions: Transaction[]): string {
  const header = 'Date,Type,Category,Description,Amount,Note';
  const rows = transactions.map((t) =>
    [
      t.date,
      t.type,
      t.category,
      escapeCell(t.description || ''),
      t.type === 'income' ? t.amount : -t.amount,
      escapeCell(t.note || ''),
    ].join(',')
  );
  return [header, ...rows].join('\n');
}

export function buildPnlCsv(report: PnlReport): string {
  const lines: string[] = [];

  lines.push('Month,Income,Expenses,Net,Savings Rate %');
  for (const m of report.months) {
    lines.push([m.month, m.income, -m.expenses, m.net, m.savingsRate].join(','));
  }
  lines.push(
    ['Total', report.totals.income, -report.totals.expenses, report.totals.net, report.totals.avgSavingsRate].join(',')
  );

  lines.push('');
  lines.push('Expense Category,Amount');
  for (const [category, amount] of Object.entries(report.categories).sort((a, b) => b[1] - a[1])) {
    lines.push([escapeCell(category), -amount].join(','));
  }

  const incomeEntries = Object.entries(report.incomeBreakdown ?? {});
  if (incomeEntries.length) {
    lines.push('');
    lines.push('Income Source,Amount');
    for (const [source, amount] of incomeEntries.sort((a, b) => b[1] - a[1])) {
      lines.push([escapeCell(source), amount].join(','));
    }
  }

  return lines.join('\n');
}

export type ExportOutcome = 'saved' | 'shared' | 'cancelled';

/**
 * Deliver a CSV to the user as a real file so it opens in Excel/Sheets:
 * - Android: Storage Access Framework — the user picks a folder (e.g.
 *   Downloads) and the file is written there.
 * - iOS: written to the app cache and handed to the share sheet as a file URL
 *   (Files, Mail, Drive, etc.).
 *
 * Uses expo-file-system, which ships in every existing native build via the
 * expo core package — this path is OTA-safe. Callers handle thrown errors
 * (e.g. fall back to a plain-text share).
 */
export async function saveOrShareCsv(filename: string, csv: string): Promise<ExportOutcome> {
  const FileSystem = await import('expo-file-system/legacy');

  if (Platform.OS === 'android') {
    const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
    if (!permissions.granted) return 'cancelled';
    const uri = await FileSystem.StorageAccessFramework.createFileAsync(
      permissions.directoryUri,
      filename,
      'text/csv'
    );
    await FileSystem.writeAsStringAsync(uri, csv, { encoding: FileSystem.EncodingType.UTF8 });
    return 'saved';
  }

  const fileUri = `${FileSystem.cacheDirectory}${filename}`;
  await FileSystem.writeAsStringAsync(fileUri, csv, { encoding: FileSystem.EncodingType.UTF8 });
  const result = await Share.share({ url: fileUri, title: filename });
  return result.action === Share.dismissedAction ? 'cancelled' : 'shared';
}
