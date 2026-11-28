/* eslint-disable @typescript-eslint/no-require-imports -- Native-free component fixtures. */
import React from 'react';
import { Animated } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import RegisterScreen from '../RegisterScreen';

const mockRegister = jest.fn();
const mockNavigate = jest.fn();
jest.mock('../../context/AuthContext', () => ({ useAuth: () => ({ register: mockRegister }) }));
jest.mock('../../components/CountryPicker', () => () => null);
jest.mock('../../components/ui/Icon', () => () => null);
jest.mock('../../components/ScreenShell', () => function MockScreenShell({ children }: { children: React.ReactNode }) { return children; });
jest.mock('../../components/ui/Input', () => function MockInput({ onChangeText, value, placeholder }: Record<string, unknown>) {
  const { TextInput } = require('react-native');
  return <TextInput onChangeText={onChangeText} value={value} placeholder={placeholder} />;
});

beforeEach(() => {
  jest.clearAllMocks(); mockRegister.mockResolvedValue('verification_required');
  jest.spyOn(Animated, 'spring').mockReturnValue({ start: jest.fn(), stop: jest.fn(), reset: jest.fn() });
});
afterEach(() => jest.restoreAllMocks());

async function submit() {
  const screen = render(<RegisterScreen navigation={{ navigate: mockNavigate, goBack: jest.fn() } as never}
    route={{ params: undefined } as never} />);
  fireEvent.changeText(screen.getByPlaceholderText('Rahul Sharma'), 'Fixture User');
  fireEvent.changeText(screen.getByPlaceholderText('rahul@example.com'), 'fixture@example.test');
  fireEvent.changeText(screen.getByPlaceholderText('At least 6 characters'), 'fixture-not-real-password');
  fireEvent.press(screen.getByLabelText('Continue to next step'));
  fireEvent.press(screen.getByLabelText('Continue to next step'));
  fireEvent.press(screen.getByLabelText('Start my journey'));
  await waitFor(() => expect(screen.getByText('Check your email')).toBeTruthy());
  return screen;
}

it('waits for verification instead of navigating to the signed-in application', async () => {
  const screen = await submit();
  expect(mockNavigate).not.toHaveBeenCalled();
  fireEvent.press(screen.getByText('Sign in'));
  expect(mockNavigate).toHaveBeenCalledWith('Login', undefined, { pop: true });
});

it('clears the submitted password before another registration attempt', async () => {
  const screen = await submit();
  fireEvent.press(screen.getByText('Use another email'));
  expect(screen.getByPlaceholderText('At least 6 characters').props.value).toBe('');
  expect(mockRegister).toHaveBeenCalledTimes(1);
});
