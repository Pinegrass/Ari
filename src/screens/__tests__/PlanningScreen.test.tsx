/* eslint-disable @typescript-eslint/no-require-imports -- Jest mock factories. */
import React from 'react';
import {render,fireEvent,fireEventAsync,waitFor} from '@testing-library/react-native';
import PlanningScreen from '../PlanningScreen';
import {getPlanning,savePlanning} from '../../api/product';
jest.setTimeout(20000);
let mockPrivate=false;
jest.mock('../../api/product',()=>({getPlanning:jest.fn(),savePlanning:jest.fn(),deletePlanning:jest.fn()}));
jest.mock('../../context/PrivacyContext',()=>({usePrivacy:()=>({isPrivate:mockPrivate})}));
jest.mock('../../hooks/useLocale',()=>({useLocale:()=>({locale:{currency:'USD',localeTag:'en-US'}})}));
jest.mock('@react-navigation/native',()=>({useNavigation:()=>({goBack:jest.fn()})}));
jest.mock('../../components/ScreenShell',()=>{const {View}=require('react-native');return function Shell({children}:{children:React.ReactNode}){return <View>{children}</View>;};});
beforeEach(()=>{jest.clearAllMocks();mockPrivate=false;(getPlanning as jest.Mock).mockResolvedValue({inputs:null,estimate:null,status:'missing'});});
it('requires confirmation and shows the server estimate in the account currency',async()=>{
  const screen=render(<PlanningScreen/>);
  await waitFor(()=>expect(screen.getByLabelText('Available cash now')).toBeTruthy());
  fireEvent.changeText(screen.getByLabelText('Available cash now'),'1000');
  fireEvent.changeText(screen.getByLabelText('Money to keep aside'),'100');
  fireEvent.changeText(screen.getByLabelText('Next payday (YYYY-MM-DD)'),'2026-09-25');
  fireEvent.press(screen.getByText('Confirm and calculate'));
  expect(savePlanning).not.toHaveBeenCalled();
  fireEvent.press(screen.getByRole('checkbox'));
  (savePlanning as jest.Mock).mockResolvedValue({inputs:null,status:'ready',estimate:{remaining:'900',perDay:'90',days:10,obligations:'0'}});
  await fireEventAsync.press(screen.getByText('Confirm and calculate'));
  expect(savePlanning).toHaveBeenCalledWith(expect.objectContaining({currency:'USD',cash:'1000',complete:true}));
  expect(screen.getByText('Estimated remainder: $900.00')).toBeTruthy();
});
it('hides planning inputs and amounts in private mode',async()=>{
  mockPrivate=true;
  const screen=render(<PlanningScreen/>);
  await waitFor(()=>expect(screen.getByText('Amounts hidden in Private Mode')).toBeTruthy());
  expect(screen.queryByLabelText('Available cash now')).toBeNull();
});
