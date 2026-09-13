/* eslint-disable @typescript-eslint/no-require-imports -- Jest factory resolves locale helpers locally. */
import React from 'react';
import { render } from '@testing-library/react-native';
import ThisMonthSummary from '../dashboard/ThisMonthSummary';
let mockPrivate = false;
jest.mock('../../context/PrivacyContext', () => ({ usePrivacy: () => ({ isPrivate: mockPrivate }) }));
jest.mock('../../hooks/useLocale', () => ({ useLocale: () => ({ locale: require('../../utils/locale').getLocale('IN'), formatCurrency: (n: number) => require('../../utils/locale').formatCurrency(n, 'IN') }) }));
beforeEach(() => { mockPrivate = false; });
it.each([[0, 123.55, '-₹123.55'], [500, 200, '₹300']])('labels recorded net honestly (%s, %s)', (income, expenses, expected) => {
  const screen = render(<ThisMonthSummary income={income as number} expenses={expenses as number} />);
  expect(screen.getByText('Recorded net')).toBeTruthy();
  expect(screen.getByText(expected as string)).toBeTruthy();
  expect(screen.queryByText(/saved/i)).toBeNull();
});
it('does not reveal a percentage or signed net in Private Mode', () => {
  mockPrivate = true;
  const screen = render(<ThisMonthSummary income={500} expenses={200} />);
  expect(screen.getAllByText('••••')).toHaveLength(3);
  expect(screen.queryByText(/%/)).toBeNull();
  expect(screen.queryByText('₹300')).toBeNull();
});
