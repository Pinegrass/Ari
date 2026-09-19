/* eslint-disable @typescript-eslint/no-require-imports -- Isolated module boot state. */
const mockRequest=jest.fn();
const mockRead=jest.fn();
jest.mock('../../api/client',()=>({apiRequest:(...args:unknown[])=>mockRequest(...args)}));
jest.mock('@react-native-async-storage/async-storage',()=>({__esModule:true,default:{getItem:(...args:unknown[])=>mockRead(...args)}}));
let analytics:typeof import('../analytics');
const marker={measurementDeliveryId:'00000000-0000-4000-8000-000000000002'};
const consent={enabled:true,consentEpoch:'00000000-0000-4000-8000-000000000001'};
const flush=async()=>{await Promise.resolve();await Promise.resolve();await Promise.resolve();};
beforeEach(()=>{jest.clearAllMocks();mockRead.mockResolvedValue(null);mockRequest.mockResolvedValue(consent);jest.isolateModules(()=>{analytics=require('../analytics');});});
it('holds one boot marker until existing consent and restored identity are resolved',async()=>{
  analytics.trackNotificationOpen(marker);
  await analytics.initAnalytics();expect(mockRequest).not.toHaveBeenCalled();
  analytics.identifyRestoredUser('owner');await flush();
  expect(mockRequest).toHaveBeenCalledWith('/measurement/v2/notification-open',{method:'POST',body:JSON.stringify({deliveryId:marker.measurementDeliveryId,consentEpoch:consent.consentEpoch})});
});
it('does not bind a boot marker to an interactive login',async()=>{
  analytics.trackNotificationOpen(marker);await analytics.initAnalytics();analytics.identifyUser('new-account');await flush();
  expect(mockRequest.mock.calls.filter(([path])=>path.endsWith('notification-open'))).toHaveLength(0);
});
it.each(['withdraw','private','logout','reconsent','switch','expired'])('discards pending startup marker after %s',async(change)=>{
  analytics.trackNotificationOpen(marker);await analytics.initAnalytics();
  let resolve!:(value:unknown)=>void;
  mockRequest.mockReturnValueOnce(new Promise(r=>{resolve=r;}));
  analytics.identifyRestoredUser('owner');
  if(change==='withdraw')analytics.setMeasurementAllowed(false);
  if(change==='private')analytics.setPrivacyEnabled(true);
  if(change==='logout')analytics.resetAnalytics();
  if(change==='reconsent')analytics.setMeasurementAllowed(true,'new-epoch');
  if(change==='switch')analytics.identifyUser('other');
  const date=change==='expired'?jest.spyOn(Date,'now').mockReturnValue(Date.now()+31_000):null;
  resolve(consent);await flush();date?.mockRestore();
  expect(mockRequest.mock.calls.filter(([path])=>path.endsWith('notification-open'))).toHaveLength(0);
});
it('does not replay after server reports no existing consent',async()=>{
  mockRequest.mockResolvedValueOnce({enabled:false,consentEpoch:null});
  analytics.trackNotificationOpen(marker);await analytics.initAnalytics();analytics.identifyRestoredUser('owner');await flush();
  analytics.setMeasurementAllowed(true,consent.consentEpoch);
  expect(mockRequest.mock.calls.filter(([path])=>path.endsWith('notification-open'))).toHaveLength(0);
});
it('still initializes future collection after a privacy choice closed the boot buffer',async()=>{
  analytics.trackNotificationOpen(marker);await analytics.initAnalytics();
  analytics.setPrivacyEnabled(true);analytics.setPrivacyEnabled(false);
  analytics.identifyRestoredUser('owner');await flush();
  expect(mockRequest.mock.calls.filter(([path])=>path.endsWith('notification-open'))).toHaveLength(0);
  analytics.trackNotificationOpen(marker);
  expect(mockRequest.mock.calls.filter(([path])=>path.endsWith('notification-open'))).toHaveLength(1);
});
