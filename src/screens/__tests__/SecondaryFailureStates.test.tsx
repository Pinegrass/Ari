/* eslint-disable @typescript-eslint/no-require-imports -- Jest isolated component factories. */
import React from 'react';
import {Alert} from 'react-native';
import {render,waitFor,fireEvent} from '@testing-library/react-native';
import PnlReportScreen from '../accountant/PnlReportScreen';
import LinkBankConsentDetailScreen from '../LinkBankConsentDetailScreen';
import {getPnlReport} from '../../api/reports';
import {getAaConsent,syncAaConsent} from '../../api/aa';
import {phrase} from '../../i18n/phrases';
jest.setTimeout(20000);
let mockPrivate=false;
jest.mock('../../api/reports',()=>({getPnlReport:jest.fn()}));
jest.mock('../../api/aa',()=>({getAaConsent:jest.fn(),syncAaConsent:jest.fn()}));
jest.mock('../../context/PrivacyContext',()=>({usePrivacy:()=>({isPrivate:mockPrivate,formatAmount:(value:number)=>mockPrivate?'••••':String(value)})}));
jest.mock('../../i18n/LanguageContext',()=>({useLanguage:()=>({language:'hi',phrase:(text:string)=>require('../../i18n/phrases').phrase('hi',text)})}));
jest.mock('../../components/ScreenShell',()=>({children}:{children:React.ReactNode})=>children);
jest.mock('../../components/ui/AnimatedEntry',()=>({children}:{children:React.ReactNode})=>children);
jest.mock('@react-navigation/native',()=>({
 useRoute:()=>({params:{consentHandle:'owned-handle'}}),useNavigation:()=>({goBack:jest.fn()}),
 useFocusEffect:(effect:()=>void)=>require('react').useEffect(effect,[effect]),
}));
beforeEach(()=>{mockPrivate=false;jest.clearAllMocks();(getAaConsent as jest.Mock).mockResolvedValue({status:'ACTIVE',fiTypes:['DEPOSIT']});});
it('distinguishes report failure from empty records and retries in Hindi',async()=>{
 (getPnlReport as jest.Mock).mockRejectedValueOnce(new Error('private failure')).mockResolvedValueOnce({months:[]});
 const screen=render(<PnlReportScreen/>);
 await waitFor(()=>expect(screen.getByText(phrase('hi','Could not load report.'))).toBeTruthy());
 expect(screen.queryByText(phrase('hi','No Data Yet'))).toBeNull();
 fireEvent.press(screen.getByText(phrase('hi','Retry')));
 await waitFor(()=>expect(screen.getByText(phrase('hi','No Data Yet'))).toBeTruthy());
});
it('keeps provider failures out of bank sync alerts',async()=>{
 const alert=jest.spyOn(Alert,'alert').mockImplementation(()=>{});
 (syncAaConsent as jest.Mock).mockRejectedValueOnce(new Error('provider secret'));
 const screen=render(<LinkBankConsentDetailScreen/>);
 await waitFor(()=>expect(screen.getByLabelText(phrase('hi','Sync latest transactions'))).toBeTruthy());
 fireEvent.press(screen.getByLabelText(phrase('hi','Sync latest transactions')));
 await waitFor(()=>expect(alert).toHaveBeenCalledWith(phrase('hi','Sync failed'),phrase('hi','Sync failed. Please try again.')));
 expect(screen.queryByText('provider secret')).toBeNull();alert.mockRestore();
});
it('interpolates bank import counts without returning to English',async()=>{
 const alert=jest.spyOn(Alert,'alert').mockImplementation(()=>{});
 (syncAaConsent as jest.Mock).mockResolvedValueOnce({imported:2,duplicates:3});
 const screen=render(<LinkBankConsentDetailScreen/>);
 await waitFor(()=>expect(screen.getByLabelText(phrase('hi','Sync latest transactions'))).toBeTruthy());
 fireEvent.press(screen.getByLabelText(phrase('hi','Sync latest transactions')));
 await waitFor(()=>expect(alert).toHaveBeenCalledWith(phrase('hi','Sync complete'),'आयात की गई एंट्री: 2। पहले से दर्ज: 3।'));alert.mockRestore();
});

it('masks P&L chart and table amounts without a sign prefix in private mode',async()=>{
 mockPrivate=true;
 (getPnlReport as jest.Mock).mockResolvedValue({months:[{month:'2026-08',income:200,expenses:100,net:100}],totals:{income:200,expenses:100,net:100,avgSavingsRate:50},trends:{expenseChange:0,incomeChange:0},categories:{},incomeBreakdown:{}});
 const screen=render(<PnlReportScreen/>);
 await waitFor(()=>expect(screen.getAllByText('••••').length).toBeGreaterThan(0));
 expect(screen.queryByText('0k')).toBeNull();expect(screen.queryByText('+••••')).toBeNull();
 expect(screen.queryByText('100')).toBeNull();
});
