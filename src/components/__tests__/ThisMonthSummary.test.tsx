import React from 'react';
import { render } from '@testing-library/react-native';
import ThisMonthSummary from '../dashboard/ThisMonthSummary';

jest.mock('../../context/PrivacyContext', () => ({
  usePrivacy: () => ({ formatAmount: (value: number) => `₹${Math.abs(value)}` }),
}));

describe('ThisMonthSummary', () => {
  it('labels negative cash flow as a deficit', () => {
    const { getAllByText, getByText, queryByText } = render(
      <ThisMonthSummary income={0} expenses={123} />
    );

    expect(getByText('Deficit')).toBeTruthy();
    expect(queryByText('Saved')).toBeNull();
    expect(getAllByText('₹123')).toHaveLength(2);
  });

  it('labels positive cash flow as saved', () => {
    const { getByText, queryByText } = render(
      <ThisMonthSummary income={500} expenses={200} />
    );

    expect(getByText('Saved')).toBeTruthy();
    expect(queryByText('Deficit')).toBeNull();
    expect(getByText('60% saved')).toBeTruthy();
  });
});
