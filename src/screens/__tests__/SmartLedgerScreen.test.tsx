/* eslint-disable @typescript-eslint/no-require-imports -- Jest factories resolve React locally. */
import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SmartLedgerScreen from '../accountant/SmartLedgerScreen';
import { PrivacyProvider } from '../../context/PrivacyContext';
import { getTransactions } from '../../api/transactions';
import { color } from '../../theme/tokens';

let mockCountry = 'IN';
jest.mock('../../api/transactions', () => ({ getTransactions: jest.fn() }));
jest.mock('../../lib/analytics', () => ({ setPrivacyEnabled: jest.fn() }));
jest.mock('../../i18n/LanguageContext', () => ({ useLanguage: () => ({ phrase: (text: string) => text }) }));
jest.mock('../../hooks/useLocale', () => ({ useLocale: () => ({ locale: require('../../utils/locale').getLocale(mockCountry) }) }));
jest.mock('../../hooks/useHaptics', () => ({ useHaptics: () => ({ light: jest.fn() }) }));
jest.mock('../../components/ScreenShell', () => ({ children }: { children: React.ReactNode }) => children);
jest.mock('../../components/ui/AnimatedEntry', () => ({ children }: { children: React.ReactNode }) => children);
jest.mock('../../components/ui/Icon', () => ({ __esModule: true, default: () => null, CATEGORY_ICONS: {} }));
jest.mock('@react-navigation/native', () => ({
  useRoute: () => ({ params: undefined }),
  useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn() }),
  useFocusEffect: (effect: () => (() => void)) => { require('react').useEffect(effect, [effect]); },
}));

beforeEach(() => {
  mockCountry = 'IN';
  (AsyncStorage.getItem as jest.Mock).mockResolvedValue('0');
});

it.each([
  ['IN', 100, 225.55, '= -₹125.55'],
  ['IN', 225.55, 100, '= ₹125.55'],
  ['IN', 100, 100, '= ₹0'],
  ['US', 100, 225.55, '= -$125.55'],
])('renders signed net for %s with income %s and expense %s', async (country, income, expense, expected) => {
  mockCountry = country as string;
  (getTransactions as jest.Mock).mockResolvedValue([
    { id: 'income', type: 'income', amount: income, category: 'salary', description: 'Income', date: '2026-09-13' },
    { id: 'expense', type: 'expense', amount: expense, category: 'food', description: 'Expense', date: '2026-09-13' },
  ]);
  const screen = render(<PrivacyProvider><SmartLedgerScreen /></PrivacyProvider>);
  await waitFor(() => expect(screen.getByText(expected as string)).toBeTruthy(), { timeout: 10000 });
  expect(screen.getByText(expected as string)).toBeTruthy();
});

it.each([100, -100])('hides net amount, sign and directional color in Private Mode (%s)', async net => {
  (AsyncStorage.getItem as jest.Mock).mockResolvedValue('1');
  (getTransactions as jest.Mock).mockResolvedValue([
    { id: 'entry', type: net > 0 ? 'income' : 'expense', amount: Math.abs(net), category: 'food', description: 'Entry', date: '2026-09-13' },
  ]);
  const screen = render(<PrivacyProvider><SmartLedgerScreen /></PrivacyProvider>);
  await waitFor(() => expect(screen.getByText('1 txns')).toBeTruthy(), { timeout: 10000 });
  expect(screen.getByText('= ••••')).toHaveStyle({ color: color.ink });
  expect(screen.queryByText(/₹100/)).toBeNull();
});

