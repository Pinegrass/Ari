import { Platform, Share } from 'react-native';
import type { PnlReport, Transaction } from '../types';

const FORMULA_PREFIX = /^[=+\-@\t\r]/;

// Quotes make commas/newlines safe; the leading apostrophe prevents Excel or
// Sheets from evaluating user-controlled descriptions as formulas.
const escapeCell = (value: string): string => {
  const safeValue = FORMULA_PREFIX.test(value) ? `'${value}` : value;
  return `"${safeValue.replace(/"/g, '""')}"`;
};

export function buildTransactionsCsv(transactions: Transaction[]): string {
  const header = 'Date,Type,Category,Description,Amount,Note';
  const rows = transactions.map((transaction) =>
    [
      transaction.date,
      transaction.type,
      escapeCell(transaction.category),
      escapeCell(transaction.description || ''),
      transaction.type === 'income' ? transaction.amount : -transaction.amount,
      escapeCell(transaction.note || ''),
    ].join(','),
  );
  return [header, ...rows].join('\n');
}

export function buildPnlCsv(report: PnlReport): string {
  const lines = ['Month,Income,Expenses,Net,Savings Rate %'];

  for (const month of report.months) {
    lines.push(
      [month.month, month.income, -month.expenses, month.net, month.savingsRate].join(','),
    );
  }
  lines.push(
    [
      'Total',
      report.totals.income,
      -report.totals.expenses,
      report.totals.net,
      report.totals.avgSavingsRate,
    ].join(','),
  );

  lines.push('', 'Expense Category,Amount');
  for (const [category, amount] of Object.entries(report.categories).sort((a, b) => b[1] - a[1])) {
    lines.push([escapeCell(category), -amount].join(','));
  }

  const incomeEntries = Object.entries(report.incomeBreakdown ?? {});
  if (incomeEntries.length > 0) {
    lines.push('', 'Income Source,Amount');
    for (const [source, amount] of incomeEntries.sort((a, b) => b[1] - a[1])) {
      lines.push([escapeCell(source), amount].join(','));
    }
  }

  return lines.join('\n');
}

export type ExportOutcome = 'saved' | 'shared' | 'cancelled';

export async function saveOrShareFile(
  filename: string,
  contents: string,
  mimeType: string,
): Promise<ExportOutcome> {
  const FileSystem = await import('expo-file-system/legacy');

  if (Platform.OS === 'android') {
    const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
    if (!permissions.granted) return 'cancelled';
    const uri = await FileSystem.StorageAccessFramework.createFileAsync(
      permissions.directoryUri,
      filename,
      mimeType,
    );
    await FileSystem.writeAsStringAsync(uri, contents, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    return 'saved';
  }

  if (!FileSystem.cacheDirectory) throw new Error('File cache is unavailable.');
  const fileUri = `${FileSystem.cacheDirectory}${filename}`;
  await FileSystem.writeAsStringAsync(fileUri, contents, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  const result = await Share.share({ url: fileUri, title: filename });
  return result.action === Share.dismissedAction ? 'cancelled' : 'shared';
}
