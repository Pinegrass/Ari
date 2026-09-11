/* eslint-disable @typescript-eslint/no-require-imports -- Jest hoisted mock factories resolve dependencies locally. */
import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import PeriodicReportsScreen from '../PeriodicReportsScreen';
import { getPeriodicReport } from '../../api/reports';
jest.setTimeout(20000);
let mockPrivate = false;
jest.mock('../../api/reports', () => ({ getPeriodicReport: jest.fn() }));
jest.mock('../../lib/analytics', () => ({ track: jest.fn() }));
jest.mock('../../context/PrivacyContext', () => ({ usePrivacy: () => ({ isPrivate: mockPrivate }) }));
jest.mock('../../hooks/useLocale', () => ({ useLocale: () => ({ locale: { currency:'INR',localeTag:'en-IN',usesDecimalAmounts:false } }) }));
jest.mock('../../components/ScreenShell', () => {
  const { View } = require('react-native'); return function MockScreenShell({children}: {children: React.ReactNode}) { return <View>{children}</View>; };
});
jest.mock('@react-navigation/native', () => ({
  useRoute: () => ({params:undefined}),
  useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn() }),
  useFocusEffect: (effect: () => (() => void)) => { require('react').useEffect(effect, [effect]); },
}));
const report = { period:'weekly',start:'2026-01-01',end:'2026-01-07', totals:{income:0,expenses:500,net:-500,transactionCount:1}, comparison:{expensesChange:null}, evidence:[{code:'private',kind:'calculated',text:'Sensitive interpretation 500'}],categories:[{name:'food',amount:500,share:100}],timeline:[],goals:[] };
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
});
