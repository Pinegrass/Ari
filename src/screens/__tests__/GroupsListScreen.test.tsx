/* eslint-disable @typescript-eslint/no-require-imports -- Jest mock factories. */
import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import GroupsListScreen from '../GroupsListScreen';
import { listGroups, createGroup } from '../../api/groups';
import { phrase } from '../../i18n/phrases';
jest.mock('../../api/groups', () => ({ listGroups: jest.fn(), createGroup: jest.fn(), joinByCode: jest.fn() }));
jest.mock('../../i18n/LanguageContext', () => ({ useLanguage: () => ({ phrase: (text: string) => require('../../i18n/phrases').phrase('hi', text) }) }));
jest.mock('../../components/ScreenShell', () => {
  const { View } = require('react-native');
  return function MockShell({ children }: { children: React.ReactNode }) { return <View>{children}</View>; };
});
jest.mock('@react-navigation/native', () => ({ useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn() }), useFocusEffect: (effect: () => void) => require('react').useEffect(effect, [effect]) }));
jest.setTimeout(20000);
beforeEach(() => { jest.clearAllMocks(); (listGroups as jest.Mock).mockResolvedValue({ groups: [] }); });
it('shows a localized retry rather than an empty account after a load failure', async () => {
  (listGroups as jest.Mock).mockRejectedValueOnce(new Error('private server detail'));
  const screen = render(<GroupsListScreen />);
  await waitFor(() => expect(screen.getByText(phrase('hi', 'Could not load groups.'))).toBeTruthy());
  expect(screen.queryByText(phrase('hi', 'No groups yet'))).toBeNull();
  fireEvent.press(screen.getByText(phrase('hi', 'Retry')));
  await waitFor(() => expect(screen.getByText(phrase('hi', 'No groups yet'))).toBeTruthy());
});
it('labels fields in Hindi, retains the draft and sanitizes create failure', async () => {
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  (createGroup as jest.Mock).mockRejectedValueOnce(new Error('database secret'));
  const screen = render(<GroupsListScreen />);
  await waitFor(() => expect(screen.getByText(phrase('hi', 'No groups yet'))).toBeTruthy());
  fireEvent.press(screen.getByText(phrase('hi', 'Create group')));
  fireEvent.changeText(screen.getByLabelText(phrase('hi', 'Group name')), 'My own name');
  fireEvent.press(screen.getByText(phrase('hi', 'Create')));
  await waitFor(() => expect(alert).toHaveBeenCalledWith(phrase('hi', 'Could not create group'), phrase('hi', 'Check your connection and try again.')));
  expect(screen.getByDisplayValue('My own name')).toBeTruthy();
  alert.mockRestore();
});
