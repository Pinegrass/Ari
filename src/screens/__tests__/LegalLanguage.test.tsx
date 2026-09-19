/* eslint-disable @typescript-eslint/no-require-imports -- Jest native fixtures. */
import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import PrivacyPolicyScreen from '../PrivacyPolicyScreen';
import TermsScreen from '../TermsScreen';

let mockLanguage: 'en' | 'hi' = 'hi';
const mockSetLanguage = jest.fn();
jest.mock('../../i18n/LanguageContext', () => ({ useLanguage: () => ({
  language: mockLanguage, phrase: (text: string) => text, setLanguage: mockSetLanguage,
}) }));
jest.mock('../../components/ui/Icon', () => () => null);
jest.mock('../../components/ScreenShell', () => {
  const { View } = require('react-native');
  return function Shell({ children }: { children: React.ReactNode }) { return <View>{children}</View>; };
});
jest.mock('../../components/ui/AnimatedEntry', () => {
  const { View } = require('react-native');
  return function Entry({ children }: { children: React.ReactNode }) { return <View>{children}</View>; };
});

beforeEach(() => { mockLanguage = 'hi'; jest.clearAllMocks(); });
it('shows Hindi privacy with correct speech language and an English switch', () => {
  const view = render(<PrivacyPolicyScreen onBack={jest.fn()} />);
  const retention = view.getByText(/घटनाओं का इतिहास 90 दिन बाद/);
  expect(retention.props.accessibilityLanguage).toBe('hi');
  expect(view.getByText(/सहमति अवधि तक सीमित छद्मनाम/)).toBeTruthy();
  expect(view.getByText(/स्टोर सदस्यता अपने-आप रद्द नहीं होती/)).toBeTruthy();
  fireEvent.press(view.getByText('Read in English'));
  expect(mockSetLanguage).toHaveBeenCalledWith('en');
  mockLanguage = 'en'; view.rerender(<PrivacyPolicyScreen onBack={jest.fn()} />);
  expect(view.getByText(/Event history expires after 90 days/).props.accessibilityLanguage).toBe('en');
  expect(view.queryByText(/घटनाओं का इतिहास 90 दिन बाद/)).toBeNull();
});
it('keeps all terms and the separate no-card trial checkout in both languages', () => {
  const view = render(<TermsScreen onBack={jest.fn()} />);
  expect(view.getByText('12. संपर्क')).toBeTruthy();
  expect(view.getByText(/14-दिन के Ari ट्रायल के लिए कार्ड नहीं चाहिए/).props.accessibilityLanguage).toBe('hi');
  expect(view.getByText(/₹5,000/)).toBeTruthy();
  mockLanguage = 'en'; view.rerender(<TermsScreen onBack={jest.fn()} />);
  expect(view.getByText('12. Contact')).toBeTruthy();
  expect(view.getByText(/A purchase requires a separate checkout/).props.accessibilityLanguage).toBe('en');
});
