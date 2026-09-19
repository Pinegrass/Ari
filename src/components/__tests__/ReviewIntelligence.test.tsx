import React from 'react';
import { Alert } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';
import { ReviewIntelligence } from '../ReviewIntelligence';
import { confirmRecurringCandidate, getRecurringCandidates } from '../../api/reviewIntelligence';
jest.mock('../../api/reviewIntelligence', () => ({ getRecurringCandidates: jest.fn(), confirmRecurringCandidate: jest.fn() }));
const getCandidates = jest.mocked(getRecurringCandidates);
const confirm = jest.mocked(confirmRecurringCandidate);
const entry = { id: 'owned', amount: '10', date: '2026-09-01', type: 'expense' as const, category: 'food', description: 'Lunch', note: 'preserved', updatedAt: '2026-09-01T00:00:00Z' };
const candidate = { id: 'candidate', label: 'Lunch', amount: '10', currency: 'INR', expectedOn: '2026-10-01', candidateType: 'recurring_expense' as const, sourceEntries: [entry], confirmation: { body: { isRecurring: true as const, recurrenceRule: 'monthly' as const, updatedAt: entry.updatedAt } } };
const props = { language: 'en' as const, money: (v: number) => `₹${v}`, day: (v: string) => v, onEdit: jest.fn(), onPlanning: jest.fn(), onChanged: jest.fn(), provenance: { revision: 'r', groups: { current: { start: entry.date, end: entry.date, entries: [entry] } } } };
beforeEach(() => { jest.clearAllMocks(); getCandidates.mockResolvedValue({ candidates: [candidate] }); confirm.mockResolvedValue({}); });
it('opens the exact source entry and preserves original edit data', async () => {
  const ui = render(<ReviewIntelligence {...props} />);
  await act(async () => {});
  fireEvent.press(ui.getByText('Check the source entries'));
  fireEvent.press(ui.getByText('Edit entry: Lunch'));
  expect(props.onEdit).toHaveBeenCalledWith(entry);
});
it('requires explicit confirmation and keeps a failed save retryable', async () => {
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  confirm.mockRejectedValueOnce({ status: 500 });
  const ui = render(<ReviewIntelligence {...props} />);
  await act(async () => {});
  fireEvent.press(ui.getByText('Confirm recurrence · Monthly'));
  expect(confirm).not.toHaveBeenCalled();
  await act(async () => { alert.mock.calls[0][2]?.[1].onPress?.(); });
  expect(ui.getByText('Could not complete this request. Please retry.')).toBeTruthy();
  expect(props.onChanged).not.toHaveBeenCalled();
  fireEvent.press(ui.getByText('Confirm recurrence · Monthly'));
  await act(async () => { alert.mock.calls[1][2]?.[1].onPress?.(); });
  expect(props.onChanged).toHaveBeenCalledTimes(1);
  alert.mockRestore();
});
it('keeps loading failure distinct from empty and supports Hindi retry', async () => {
  getCandidates.mockRejectedValueOnce(new Error('offline'));
  const ui = render(<ReviewIntelligence {...props} language="hi" />);
  await act(async () => {});
  expect(ui.getByText('अनुरोध पूरा नहीं हुआ। फिर कोशिश करें।')).toBeTruthy();
  expect(ui.queryByText('अभी कोई भरोसेमंद दोहराव का पैटर्न नहीं मिला।')).toBeNull();
  getCandidates.mockResolvedValueOnce({ candidates: [] });
  await act(async () => { fireEvent.press(ui.getByText('सुझाव रीफ़्रेश करें')); });
  expect(ui.getByText('अभी कोई भरोसेमंद दोहराव का पैटर्न नहीं मिला।')).toBeTruthy();
});

it('shows the actual weekly cadence in confirmation without silently enabling it', async () => {
  const weekly = { ...candidate, confirmation: { body: { ...candidate.confirmation.body, recurrenceRule: 'weekly' as const } } };
  getCandidates.mockResolvedValueOnce({ candidates: [weekly] });
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  const ui = render(<ReviewIntelligence {...props} />);
  await act(async () => {});
  fireEvent.press(ui.getByText('Confirm recurrence · Weekly'));
  expect(alert.mock.calls[0][0]).toBe('Enable this recurrence? Weekly');
  expect(confirm).not.toHaveBeenCalled();
  await act(async () => { alert.mock.calls[0][2]?.[1].onPress?.(); });
  expect(confirm).toHaveBeenCalledWith(weekly);
  alert.mockRestore();
});

it('labels capped history as unavailable instead of claiming no pattern', async () => {
  getCandidates.mockResolvedValueOnce({ candidates: [], status: 'history_limit' });
  const ui = render(<ReviewIntelligence {...props} />);
  await act(async () => {});
  expect(ui.getByText('There are too many entries to assess this history safely. No pattern is suggested from an incomplete sample.')).toBeTruthy();
  expect(ui.queryByText('No reliable recurring pattern found yet.')).toBeNull();
});
