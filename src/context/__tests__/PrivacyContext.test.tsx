import React from 'react';
import { Text } from 'react-native';
import { act, render, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PrivacyProvider, usePrivacy } from '../PrivacyContext';
jest.mock('../../lib/analytics', () => ({setPrivacyEnabled:jest.fn()}));
function Probe() { const {isPrivate} = usePrivacy(); return <Text>{isPrivate ? 'masked' : 'visible'}</Text>; }
it('keeps figures masked until the stored preference loads', async () => {
  let resolve!: (value:string|null)=>void;
  (AsyncStorage.getItem as jest.Mock).mockReturnValueOnce(new Promise<string|null>(done=>{resolve=done;}));
  const screen=render(<PrivacyProvider><Probe /></PrivacyProvider>);
  expect(screen.getByText('masked')).toBeTruthy();
  await act(async()=>{resolve('0');});
  await waitFor(()=>expect(screen.getByText('visible')).toBeTruthy());
});
it('keeps figures masked when preferences cannot be read', async () => {
  (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('unavailable'));
  const screen=render(<PrivacyProvider><Probe /></PrivacyProvider>);
  await act(async()=>{});
  expect(screen.getByText('masked')).toBeTruthy();
});
