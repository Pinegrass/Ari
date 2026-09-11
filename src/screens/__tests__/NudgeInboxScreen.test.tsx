/* eslint-disable @typescript-eslint/no-require-imports -- Jest hoisted factories. */
import React from 'react';
import {fireEvent, fireEventAsync, render, waitFor} from '@testing-library/react-native';
import NudgeInboxScreen from '../NudgeInboxScreen';
import {getNudgeInbox, dismissInboxNudge} from '../../api/nudges';
jest.setTimeout(20000);
const mockNavigate = jest.fn();
jest.mock('../../api/nudges',()=>({getNudgeInbox:jest.fn(),dismissInboxNudge:jest.fn()}));
jest.mock('../../lib/analytics',()=>({track:jest.fn()}));
jest.mock('../../components/ScreenShell',()=>{
  const {View}=require('react-native');
  return function MockShell({children}:{children:React.ReactNode}) {return <View>{children}</View>;};
});
jest.mock('@react-navigation/native',()=>({
  useNavigation:()=>({navigate:mockNavigate,goBack:jest.fn()}),
  useFocusEffect:(effect:()=>()=>void)=>require('react').useEffect(effect,[effect]),
}));
const item={id:'synthetic',title:'A review is ready',body:'Review your recorded entries',category:'reports',action:'report',period:'weekly',anchor:'2026-09-06'};
beforeEach(()=>{jest.clearAllMocks();(getNudgeInbox as jest.Mock).mockResolvedValue({items:[item]});});
it('opens the report period described by the update',async()=>{
  const screen=render(<NudgeInboxScreen/>);
  await waitFor(()=>expect(screen.getByText(item.title)).toBeTruthy());
  fireEvent.press(screen.getByText('Review'));
  expect(mockNavigate).toHaveBeenCalledWith('PeriodicReports',{period:'weekly',anchor:'2026-09-06'});
});
it('keeps an update after a failed dismissal and removes it after confirmation',async()=>{
  (dismissInboxNudge as jest.Mock).mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(undefined);
  const screen=render(<NudgeInboxScreen/>);
  await waitFor(()=>expect(screen.getByText(item.title)).toBeTruthy());
  await fireEventAsync.press(screen.getByText('Dismiss'));
  await waitFor(()=>expect(screen.getByText(/Could not dismiss/)).toBeTruthy());
  expect(screen.getByText(item.title)).toBeTruthy();
  await fireEventAsync.press(screen.getByText('Dismiss'));
  await waitFor(()=>expect(screen.queryByText(item.title)).toBeNull());
  expect(dismissInboxNudge).toHaveBeenCalledWith('synthetic');
});
it('recovers from an inbox load failure',async()=>{
  (getNudgeInbox as jest.Mock).mockRejectedValueOnce(new Error('offline'));
  const screen=render(<NudgeInboxScreen/>);
  await waitFor(()=>expect(screen.getByText('Try again')).toBeTruthy());
  fireEvent.press(screen.getByText('Try again'));
  await waitFor(()=>expect(screen.getByText(item.title)).toBeTruthy());
});
