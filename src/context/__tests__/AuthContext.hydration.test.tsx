import React from 'react';
import {Text} from 'react-native';
import {act,render,waitFor} from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {AuthProvider,useAuth} from '../AuthContext';
import {secureStorage} from '../../lib/secureStorage';
import * as authApi from '../../api/auth';
import {ApiError} from '../../api/client';
jest.mock('../../api/auth',()=>({getMe:jest.fn()}));
jest.mock('../../api/push',()=>({registerPushToken:jest.fn(),clearPushToken:jest.fn()}));
jest.mock('../../lib/push',()=>({getExpoPushToken:jest.fn()}));
jest.mock('../../lib/analytics',()=>({identifyUser:jest.fn(),resetAnalytics:jest.fn(),track:jest.fn()}));
jest.mock('../../lib/socialAuth',()=>({signOutGoogle:jest.fn()}));
jest.mock('../../lib/localStore',()=>({localStore:{}}));
jest.mock('../../lib/supabase',()=>({supabase:{},isSupabaseConfigured:()=>false}));
jest.mock('../../config/sentry',()=>({addBreadcrumb:jest.fn(),captureError:jest.fn(),setUserContext:jest.fn(),clearUserContext:jest.fn()}));
jest.mock('../../lib/revenuecat',()=>({refreshEntitlements:jest.fn().mockResolvedValue(false),syncRevenueCatUser:jest.fn().mockResolvedValue(false)}));
jest.mock('../../lib/authTelemetry',()=>({authApiErrorCode:jest.fn(),trackAuthAttempt:jest.fn(),trackAuthResult:jest.fn()}));
function Probe(){const {user,loading}=useAuth();return <Text>{loading?'loading':user?'cached account':'signed out'}</Text>;}
let rejectValidation:(reason:unknown)=>void;
beforeEach(()=>{
 jest.clearAllMocks();
 jest.spyOn(secureStorage,'getItem').mockResolvedValue('cached-token');
 jest.spyOn(secureStorage,'removeItem').mockResolvedValue();
 (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify({id:101,name:'Cached',tier:'free'}));
 (authApi.getMe as jest.Mock).mockImplementation(()=>new Promise((_,reject)=>{rejectValidation=reject;}));
});
it('renders cached data while cold-start validation is still pending',async()=>{
 const screen=render(<AuthProvider><Probe/></AuthProvider>);
 await waitFor(()=>expect(screen.getByText('cached account')).toBeTruthy());
 expect(authApi.getMe).toHaveBeenCalledTimes(1);
});
it('keeps cached data available when validation fails offline',async()=>{
 const screen=render(<AuthProvider><Probe/></AuthProvider>);
 await waitFor(()=>expect(screen.getByText('cached account')).toBeTruthy());
 await act(async()=>{rejectValidation(new ApiError(0,'offline'));});
 expect(screen.getByText('cached account')).toBeTruthy();
 expect(secureStorage.removeItem).not.toHaveBeenCalled();
});
it('still clears the cached session after a real unauthorized response',async()=>{
 const screen=render(<AuthProvider><Probe/></AuthProvider>);
 await waitFor(()=>expect(screen.getByText('cached account')).toBeTruthy());
 await act(async()=>{rejectValidation(new ApiError(401,'unauthorized'));});
 await waitFor(()=>expect(screen.getByText('signed out')).toBeTruthy());
 expect(secureStorage.removeItem).toHaveBeenCalledWith('ari_token');
 expect(AsyncStorage.removeItem).toHaveBeenCalledWith('ari_user');
});
