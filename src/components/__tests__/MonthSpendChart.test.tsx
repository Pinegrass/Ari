import React from 'react';
import { render } from '@testing-library/react-native';
import MonthSpendChart from '../dashboard/MonthSpendChart';

jest.mock('react-native-gifted-charts', () => ({ LineChart: () => null }));
jest.mock('../../context/PrivacyContext', () => ({
  usePrivacy: () => ({ formatAmount: () => '••••' }),
}));

it('does not expose the total while private mode is enabled', () => {
  const view = render(<MonthSpendChart data={{
    month: '2026-09', days: { '2026-09-11': 731 }, max: 731, total: 731,
  }} />);
  expect(view.getByText('••••')).toBeTruthy();
  expect(view.queryByText(/731/)).toBeNull();
});
