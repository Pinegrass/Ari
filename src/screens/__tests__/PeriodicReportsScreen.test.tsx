/* eslint-disable @typescript-eslint/no-require-imports -- Jest hoisted mock factories resolve dependencies locally. */
import React from 'react';
import { render, waitFor, fireEvent, act } from '@testing-library/react-native';
import { ScrollView } from 'react-native';
import PeriodicReportsScreen from '../PeriodicReportsScreen';
import { getPeriodicReport, type PeriodicReport } from '../../api/reports';
jest.setTimeout(20000);
let mockPrivate = false;
const mockNavigate=jest.fn();
jest.mock('../../context/DataContext', () => ({ useData: () => ({ fetchTransactions: jest.fn().mockResolvedValue(undefined) }) }));
jest.mock('../../lib/localStore', () => ({ localStore: { getAll: jest.fn().mockResolvedValue([]) } }));
jest.mock('../../api/reports', () => ({ getPeriodicReport: jest.fn() }));
jest.mock('../../lib/analytics', () => ({ track: jest.fn() }));
jest.mock('../../context/PrivacyContext', () => ({ usePrivacy: () => ({ isPrivate: mockPrivate }) }));
jest.mock('../../hooks/useLocale', () => ({ useLocale: () => ({ locale: { currency:'INR',localeTag:'en-IN',usesDecimalAmounts:false } }) }));
jest.mock('../../components/ScreenShell', () => {
  const { View } = require('react-native'); return function MockScreenShell({children}: {children: React.ReactNode}) { return <View>{children}</View>; };
});
jest.mock('@react-navigation/native', () => ({
  useRoute: () => ({params:undefined}),
  useNavigation: () => ({ navigate: mockNavigate, goBack: jest.fn() }),
  useFocusEffect: (effect: () => (() => void)) => { require('react').useEffect(effect, [effect]); },
}));
const report: PeriodicReport = {
 period: 'weekly', start: '2026-01-01', end: '2026-01-07', label: '1–7 Jan', highlight: '',
 totals: { income: 0, expenses: 500, net: -500, transactionCount: 1, savingsRate: 0 },
 comparison: { expensesChange: null, incomeChange: null, previousExpenses: 0, previousIncome: 0 },
 evidence: [{ code: 'private', kind: 'calculated', text: 'Sensitive interpretation 500' }],
 categories: [{ name: 'food', amount: 500, share: 100 }],
 timeline: [{ date: '2026-01-01', label: 'Thu', income: 0, expenses: 500 }], goals: [],
};
beforeEach(() => { mockPrivate=false; (getPeriodicReport as jest.Mock).mockResolvedValue(report); });
it('shows a negative cash flow with its sign and honest limits', async () => {
  const screen=render(<PeriodicReportsScreen />);
  await waitFor(() => expect(screen.getByText('-₹500')).toBeTruthy());
  expect(screen.getByText('Recorded net cash flow')).toBeTruthy();
  expect(screen.getByText(/Bank balances, unrecorded bills/)).toBeTruthy();
});
it('masks totals and removes sensitive interpretation in private mode', async () => {
  mockPrivate=true;
  const screen=render(<PeriodicReportsScreen />);
  await waitFor(() => expect(screen.getByText('Amounts hidden in Private Mode')).toBeTruthy());
  expect(screen.queryByText('-₹500')).toBeNull();
  expect(screen.queryByText(/Sensitive interpretation/)).toBeNull();
  expect(screen.queryByText('food')).toBeNull();
  expect(screen.queryByText('Your next money habit')).toBeNull();
});

it('opens entries from the report',async()=>{
 const screen=render(<PeriodicReportsScreen/>);
 await waitFor(()=>expect(screen.getAllByText('Review entries →').length).toBeGreaterThan(0));
 fireEvent.press(screen.getAllByText('Review entries →')[0]);
 expect(mockNavigate).toHaveBeenCalledWith('Tabs', { screen: 'Transactions' }, { pop: true });
});

it('offers the income action when a personal report has spending but no recorded income', async () => {
 const screen = render(<PeriodicReportsScreen />);
 await waitFor(() => expect(screen.getByText('Add income →')).toBeTruthy());
 fireEvent.press(screen.getByText('Add income →'));
 expect(mockNavigate).toHaveBeenCalledWith('AddTransaction', { type: 'income' });
});

it('keeps a loaded report after a refresh failure and lets the user retry', async () => {
 const screen = render(<PeriodicReportsScreen />);
 await waitFor(() => expect(screen.getByText('-₹500')).toBeTruthy());
 jest.mocked(getPeriodicReport).mockRejectedValueOnce(new Error('offline'));
 act(() => { screen.UNSAFE_getByType(ScrollView).props.refreshControl.props.onRefresh(); });
 await waitFor(() => expect(screen.getByText('Could not refresh. Showing the last loaded report.')).toBeTruthy());
 expect(screen.getByText('-₹500')).toBeTruthy();
 jest.mocked(getPeriodicReport).mockResolvedValueOnce({ ...report, totals: { ...report.totals, expenses: 900, net: -900 } });
 fireEvent.press(screen.getByText('Try again'));
 await waitFor(() => expect(screen.getByText('-₹900')).toBeTruthy());
 expect(screen.queryByText('Could not refresh. Showing the last loaded report.')).toBeNull();
});
