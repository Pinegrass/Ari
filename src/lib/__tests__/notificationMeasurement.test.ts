import {apiRequest} from '../../api/client';
import {trackNotificationOpen, setPrivacyEnabled, setMeasurementAllowed, resetAnalytics} from '../analytics';
jest.mock('../../api/client', () => ({apiRequest: jest.fn().mockResolvedValue({accepted:true})}));
const deliveryId='00000000-0000-4000-8000-000000000002';
const epoch='00000000-0000-4000-8000-000000000001';
beforeEach(()=>{jest.clearAllMocks();resetAnalytics();setPrivacyEnabled(false);});
it('requires current consent and an owned-marker-shaped UUID, and discards payload properties',()=>{
  trackNotificationOpen({measurementDeliveryId:deliveryId});
  setMeasurementAllowed(true,epoch);
  for(const data of [null,[],{nudgeId:'local_checkin:test'},{measurementDeliveryId:'bad'}])trackNotificationOpen(data);
  expect(apiRequest).not.toHaveBeenCalled();
  trackNotificationOpen({measurementDeliveryId:deliveryId,amount:200,body:'private'});
  expect(apiRequest).toHaveBeenCalledWith('/measurement/v2/notification-open',{method:'POST',body:JSON.stringify({deliveryId,consentEpoch:epoch})});
});
it('does not backfill a tap observed before consent',()=>{
  trackNotificationOpen({measurementDeliveryId:deliveryId});setMeasurementAllowed(true,epoch);
  expect(apiRequest).not.toHaveBeenCalled();
});
it('retries only the same body on a transient error',async()=>{
  setMeasurementAllowed(true,epoch);
  (apiRequest as jest.Mock).mockRejectedValueOnce({status:503}).mockResolvedValueOnce({});
  trackNotificationOpen({measurementDeliveryId:deliveryId});await Promise.resolve();await Promise.resolve();
  expect(apiRequest).toHaveBeenCalledTimes(2);
  expect((apiRequest as jest.Mock).mock.calls[0]).toEqual((apiRequest as jest.Mock).mock.calls[1]);
});
it.each(['logout','private','private-cycle','withdraw','account','forbidden'])('does not retry after %s',async(change)=>{
  setMeasurementAllowed(true,epoch);
  let reject!:(error:unknown)=>void;
  (apiRequest as jest.Mock).mockReturnValueOnce(new Promise((_,r)=>{reject=r;}));
  trackNotificationOpen({measurementDeliveryId:deliveryId});
  if(change==='logout')resetAnalytics();
  if(change==='private')setPrivacyEnabled(true);
  if(change==='private-cycle'){setPrivacyEnabled(true);setPrivacyEnabled(false);}
  if(change==='withdraw')setMeasurementAllowed(false);
  if(change==='account')setMeasurementAllowed(true,'different-epoch');
  reject({status:change==='forbidden'?403:0});await Promise.resolve();await Promise.resolve();
  expect(apiRequest).toHaveBeenCalledTimes(1);
});
