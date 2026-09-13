/* eslint-disable @typescript-eslint/no-require-imports -- Jest mock factories resolve dependencies locally. */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import DashboardScreen from '../DashboardScreen';
import { todayISO } from '../../utils/dateHelpers';
import { track } from '../../lib/analytics';
const mockNavigate = jest.fn();
const mockToggle = jest.fn();
let mockPrivate = false;
let mockLanguage: 'en' | 'hi' = 'en';
const mockFetch = jest.fn();
const entries = Array.from({ length: 5 }, (_, i) => ({ id: String(i), type: 'expense', amount: i === 0 ? 125.55 : 10, category: 'food', description: `Entry ${i}`, date: todayISO() }));
let mockData: any;
jest.mock('../../context/AuthContext', () => ({ useAuth: () => ({ user: { name: 'Test', country: 'IN' } }) }));
jest.mock('../../context/DataContext', () => ({ useData: () => mockData }));
jest.mock('../../context/PrivacyContext', () => ({ usePrivacy: () => ({ isPrivate: mockPrivate, togglePrivate: mockToggle, formatAmount: (n: number) => mockPrivate ? '••••' : `₹${n}` }) }));
jest.mock('../../context/ThemeContext', () => ({ useColors: () => require('../../theme/tokens').color }));
jest.mock('../../i18n/LanguageContext', () => ({ useLanguage: () => ({ language: mockLanguage, t: (key: string, values: any) => require('../../i18n/catalog').translate(mockLanguage, key, values) }) }));
jest.mock('../../hooks/useHaptics', () => ({ useHaptics: () => ({ light: jest.fn(), medium: jest.fn() }) }));
jest.mock('../../components/ui/Icon', () => ({ __esModule: true, default: () => null }));
jest.mock('../../lib/analytics', () => ({ track: jest.fn() }));
jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return { SafeAreaView: View, useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) };
});
jest.mock('@react-navigation/native', () => ({ useNavigation: () => ({ navigate: mockNavigate }), useFocusEffect: (effect: any) => require('react').useEffect(effect, [effect]) }));
beforeEach(() => {
  jest.clearAllMocks(); mockPrivate = false; mockLanguage = 'en';
  mockData = { transactions: entries, summary: { expenses: 800.25 }, nudge: null, loadingData: false, refreshing: false,
    fetchAll: mockFetch, fetchNudge: mockFetch, refresh: mockFetch, dismissNudge: jest.fn() };
});
it('shows three recent entries and preserves all core navigation', () => {
  const screen = render(<DashboardScreen />);
  expect(screen.getByText('₹165.55')).toBeTruthy();
  expect(screen.getByText('₹800.25')).toBeTruthy();
  expect(screen.queryByTestId('txn-row-3')).toBeNull();
  expect(screen.getByTestId('txn-row-2')).toBeTruthy();
  fireEvent.press(screen.getByLabelText('View all transactions'));
  expect(mockNavigate).toHaveBeenLastCalledWith('Tabs', { screen: 'Transactions' });
  fireEvent.press(screen.getByText('Plan to payday →'));
  expect(mockNavigate).toHaveBeenLastCalledWith('Planning');
  fireEvent.press(screen.getByLabelText('Tomo updates'));
  expect(mockNavigate).toHaveBeenLastCalledWith('NudgeInbox');
  fireEvent.press(screen.getByText('Money reports'));
  expect(mockNavigate).toHaveBeenLastCalledWith('PeriodicReports');
  fireEvent.press(screen.getByTestId('txn-row-0'));
  expect(mockNavigate).toHaveBeenLastCalledWith('AddTransaction', { editTransaction: expect.objectContaining({ id: '0', amount: 125.55 }) });
  expect(screen.queryByText('YOUR RHYTHM')).toBeNull();
  expect(screen.queryByText('Money out')).toBeNull();
});
it('keeps an explicit first-entry action only for an empty ledger', () => {
  mockData.transactions = [];
  const screen = render(<DashboardScreen />);
  fireEvent.press(screen.getByText('Add entry'));
  expect(mockNavigate).toHaveBeenCalledWith('AddTransaction', { type: 'expense' });
});
it('shows a single compact nudge and preserves open/dismiss', () => {
  mockData.nudge = { id: 'n1', title: 'Review your entries', message: 'Long sensitive detail', actionPrompt: 'Review', trigger: 'review' };
  const screen = render(<DashboardScreen />);
  expect(screen.queryByText('Long sensitive detail')).toBeNull();
  fireEvent.press(screen.getByText('Review your entries'));
  expect(mockNavigate).toHaveBeenCalledWith('Tabs', expect.objectContaining({ screen: 'Tomo' }));
  fireEvent.press(screen.getByText('Not now'));
  expect(mockData.dismissNudge).toHaveBeenCalledWith(mockData.nudge);
});
it('masks figures and suppresses both nudge display and impression in Private Mode', () => {
  mockPrivate = true;
  mockData.nudge = { id: 'n1', title: 'Sensitive title' };
  const screen = render(<DashboardScreen />);
  expect(screen.queryByText('₹165.55')).toBeNull();
  expect(screen.queryByText('₹800.25')).toBeNull();
  expect(screen.queryByText('Sensitive title')).toBeNull();
  expect(track).not.toHaveBeenCalledWith('nudge_presented', expect.anything());
  fireEvent.press(screen.getByLabelText('Show amounts'));
  expect(mockToggle).toHaveBeenCalled();
});
it('uses Hindi for the new hierarchy and controls', () => {
  mockLanguage = 'hi';
  const screen = render(<DashboardScreen />);
  expect(screen.getByText('आज का खर्च')).toBeTruthy();
  expect(screen.getByText('हाल की एंट्री')).toBeTruthy();
  expect(screen.getByLabelText('रकम छिपाएँ')).toBeTruthy();
});
