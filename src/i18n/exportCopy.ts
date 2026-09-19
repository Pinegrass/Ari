export const exportCopy = {
  en: {
    complete: 'Export complete', saved: 'File saved. Open it in your spreadsheet or files app.',
    noData: 'No data', addEntries: 'Add some transactions first to export.',
    failed: 'Export failed', retry: 'Could not export your data. Check your connection and try again.',
    title: 'Export data', csv: 'Export as CSV', csvHelp: 'Save recorded transactions or a 12-month profit and loss report.',
    transactionCount: 'Available transactions', transactionButton: 'Export transactions (CSV)',
    pnlButton: 'Export profit and loss (CSV)', accountTitle: 'Account and local bills export',
    accountHelp: 'Includes your server account records and bills owned by this account on this device. Unassigned legacy bills, other devices and unsynced transactions are excluded. Server and device records are read separately.',
    accountButton: 'Export account and bills (JSON)',
    fileWarning: 'Exported files contain financial information. Choose where to save or share them carefully.',
  },
  hi: {
    complete: 'निर्यात पूरा हुआ', saved: 'फ़ाइल सेव हो गई। इसे स्प्रेडशीट या फ़ाइल ऐप में खोलें।',
    noData: 'कोई डेटा नहीं', addEntries: 'निर्यात के लिए पहले कुछ लेनदेन जोड़ें।',
    failed: 'निर्यात नहीं हुआ', retry: 'डेटा निर्यात नहीं हुआ। इंटरनेट कनेक्शन जाँचकर फिर कोशिश करें।',
    title: 'डेटा निर्यात करें', csv: 'CSV में निर्यात करें', csvHelp: 'दर्ज लेनदेन या 12 महीने की लाभ-हानि रिपोर्ट सेव करें।',
    transactionCount: 'उपलब्ध लेनदेन', transactionButton: 'लेनदेन निर्यात करें (CSV)',
    pnlButton: 'लाभ-हानि निर्यात करें (CSV)', accountTitle: 'खाता और स्थानीय बिल निर्यात',
    accountHelp: 'इसमें सर्वर के खाता रिकॉर्ड और इस डिवाइस पर इसी खाते के बिल शामिल हैं। बिना खाते वाले पुराने बिल, दूसरे डिवाइस और सिंक न हुए लेनदेन शामिल नहीं हैं। सर्वर और डिवाइस के रिकॉर्ड अलग-अलग पढ़े जाते हैं।',
    accountButton: 'खाता और बिल निर्यात करें (JSON)',
    fileWarning: 'निर्यात की गई फ़ाइलों में वित्तीय जानकारी होती है। उन्हें सेव या साझा करने की जगह सावधानी से चुनें।',
  },
} as const;
