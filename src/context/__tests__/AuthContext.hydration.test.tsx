import React from 'react';
import {Text} from 'react-native';
import {act,render,waitFor} from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {AuthProvider,useAuth} from '../AuthContext';
import {secureStorage} from '../../lib/secureStorage';
import * as authApi from '../../api/auth';
import {identifyRestoredUser} from '../../lib/analytics';
import {ApiError} from '../../api/client';
import {setBillAccount,observeInitialBillSession} from '../../lib/bills';
import {cancelTomoCheckins,refreshTomoCheckins} from '../../hooks/useNotifications';
import {isSupabaseConfigured,supabase} from '../../lib/supabase';
jest.mock('../../lib/bills',()=>({setBillAccount:jest.fn().mockResolvedValue(undefined),observeInitialBillSession:jest.fn().mockResolvedValue(undefined),isBillAccount:jest.fn().mockReturnValue(false)}));
jest.mock('../../hooks/useNotifications',()=>({cancelTomoCheckins:jest.fn().mockResolvedValue(undefined),refreshTomoCheckins:jest.fn().mockResolvedValue(undefined)}));
jest.mock('../../api/auth',()=>({getMe:jest.fn()}));
jest.mock('../../api/push',()=>({registerPushToken:jest.fn(),clearPushToken:jest.fn()}));
jest.mock('../../lib/push',()=>({getExpoPushToken:jest.fn()}));
jest.mock('../../lib/analytics',()=>({identifyUser:jest.fn(),identifyRestoredUser:jest.fn(),resetAnalytics:jest.fn(),track:jest.fn()}));
jest.mock('../../lib/socialAuth',()=>({signOutGoogle:jest.fn()}));
jest.mock('../../lib/localStore',()=>({localStore:{}}));
jest.mock('../../lib/supabase',()=>({supabase:{auth:{onAuthStateChange:jest.fn()}},isSupabaseConfigured:jest.fn(()=>false)}));
jest.mock('../../config/sentry',()=>({addBreadcrumb:jest.fn(),captureError:jest.fn(),setUserContext:jest.fn(),clearUserContext:jest.fn()}));
jest.mock('../../lib/revenuecat',()=>({refreshEntitlements:jest.fn().mockResolvedValue(false),syncRevenueCatUser:jest.fn().mockResolvedValue(false)}));
jest.mock('../../lib/authTelemetry',()=>({authApiErrorCode:jest.fn(),trackAuthAttempt:jest.fn(),trackAuthResult:jest.fn()}));
function Probe(){const {user,loading}=useAuth();return <Text>{loading?'loading':user?'cached account':'signed out'}</Text>;}
let rejectValidation:(reason:unknown)=>void;
beforeEach(()=>{
 jest.clearAllMocks();
 jest.mocked(isSupabaseConfigured).mockReturnValue(false);
 jest.spyOn(secureStorage,'getItem').mockResolvedValue('cached-token');
 jest.spyOn(secureStorage,'removeItem').mockResolvedValue();
 (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify({id:101,name:'Cached',tier:'free'}));
 (authApi.getMe as jest.Mock).mockImplementation(()=>new Promise((_,reject)=>{rejectValidation=reject;}));
});
it('renders cached data while cold-start validation is still pending',async()=>{
 const screen=render(<AuthProvider><Probe/></AuthProvider>);
 await waitFor(()=>expect(screen.getByText('cached account')).toBeTruthy());
 expect(authApi.getMe).toHaveBeenCalledTimes(1);
 expect(identifyRestoredUser).not.toHaveBeenCalled();
 expect(setBillAccount).not.toHaveBeenCalled();
});
it('keeps cached data available when validation fails offline',async()=>{
 const screen=render(<AuthProvider><Probe/></AuthProvider>);
 await waitFor(()=>expect(screen.getByText('cached account')).toBeTruthy());
 await act(async()=>{rejectValidation(new ApiError(0,'offline'));});
 expect(screen.getByText('cached account')).toBeTruthy();
 expect(secureStorage.removeItem).not.toHaveBeenCalled();
 expect(setBillAccount).not.toHaveBeenCalled();
});
it('still clears the cached session after a real unauthorized response',async()=>{
 const screen=render(<AuthProvider><Probe/></AuthProvider>);
 await waitFor(()=>expect(screen.getByText('cached account')).toBeTruthy());
 await act(async()=>{rejectValidation(new ApiError(401,'unauthorized'));});
 await waitFor(()=>expect(screen.getByText('signed out')).toBeTruthy());
 expect(secureStorage.removeItem).toHaveBeenCalledWith('ari_token');
 expect(AsyncStorage.removeItem).toHaveBeenCalledWith('ari_user');
 expect(setBillAccount).toHaveBeenCalledWith(null);
 expect(cancelTomoCheckins).toHaveBeenCalled();
});

it('binds startup measurement only after server identity validation',async()=>{
 (authApi.getMe as jest.Mock).mockResolvedValueOnce({id:'validated-owner',name:'Owner',tier:'free'});
 render(<AuthProvider><Probe/></AuthProvider>);
 await waitFor(()=>expect(identifyRestoredUser).toHaveBeenCalledWith('validated-owner'));
 expect(setBillAccount).toHaveBeenCalledWith('validated-owner');
 await waitFor(()=>expect(refreshTomoCheckins).toHaveBeenCalled());
});

it('clears visible and cached identity on authoritative provider signout',async()=>{
 jest.mocked(isSupabaseConfigured).mockReturnValue(true);
 let signOut!:()=>void;
 jest.mocked(supabase.auth.onAuthStateChange).mockImplementation(callback=>{
  signOut=()=>{void callback('SIGNED_OUT',null);};
  return {data:{subscription:{unsubscribe:jest.fn()}}} as never;
 });
 (authApi.getMe as jest.Mock).mockResolvedValueOnce({id:'validated-owner',name:'Owner',tier:'free'});
 const screen=render(<AuthProvider><Probe/></AuthProvider>);
 await waitFor(()=>expect(setBillAccount).toHaveBeenCalledWith('validated-owner'));
 await act(async()=>{signOut();});
 expect(screen.getByText('signed out')).toBeTruthy();
 expect(setBillAccount).toHaveBeenLastCalledWith(null);
 expect(AsyncStorage.removeItem).toHaveBeenCalledWith('ari_user');
});


it('provider initial restoration preserves matching pending taps without binding bills',async()=>{
 jest.mocked(isSupabaseConfigured).mockReturnValue(true);
 let initial!:()=>void;
 jest.mocked(supabase.auth.onAuthStateChange).mockImplementation(callback=>{
  initial=()=>{void callback('INITIAL_SESSION',{user:{id:'restored-owner'}} as never);};
  return {data:{subscription:{unsubscribe:jest.fn()}}} as never;
 });
 render(<AuthProvider><Probe/></AuthProvider>);
 await waitFor(()=>expect(authApi.getMe).toHaveBeenCalled());
 await act(async()=>{initial();});
 expect(observeInitialBillSession).toHaveBeenCalledWith('restored-owner');
 expect(setBillAccount).not.toHaveBeenCalled();
});
