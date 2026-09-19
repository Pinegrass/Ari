import {apiRequest} from '../../api/client';
import {setMeasurementAllowed,setPrivacyEnabled,track,resetAnalytics,measurementRevision,applyMeasurementConsent} from '../analytics';
jest.mock('expo-crypto',()=>({randomUUID:()=> '00000000-0000-4000-8000-000000000002'}));
jest.mock('../../api/client',()=>({apiRequest:jest.fn().mockResolvedValue({})}));
beforeEach(()=>{jest.clearAllMocks();resetAnalytics();setPrivacyEnabled(false);});
it('requires explicit consent and never transmits financial properties',()=>{
  track('periodic_report_viewed',{amount:999,merchant:'private'});
  expect(apiRequest).not.toHaveBeenCalled();
  setMeasurementAllowed(true,'00000000-0000-4000-8000-000000000001');
  track('periodic_report_viewed',{amount:999,merchant:'private'});
  expect(apiRequest).toHaveBeenCalledWith('/measurement/v2/events',{method:'POST',body:JSON.stringify({event:'report_displayed',eventId:'00000000-0000-4000-8000-000000000002',consentEpoch:'00000000-0000-4000-8000-000000000001'})});
});
it('blocks collection in private mode and after withdrawal or logout',()=>{
  setMeasurementAllowed(true,'00000000-0000-4000-8000-000000000001');setPrivacyEnabled(true);track('periodic_report_viewed');
  expect(apiRequest).not.toHaveBeenCalled();
  setPrivacyEnabled(false);setMeasurementAllowed(false);track('periodic_report_viewed');
  expect(apiRequest).not.toHaveBeenCalled();
  setMeasurementAllowed(true,'00000000-0000-4000-8000-000000000001');resetAnalytics();track('periodic_report_viewed');
  expect(apiRequest).not.toHaveBeenCalled();
});

it('does not infer v2 consent from the legacy boolean or send server-owned events',()=>{
  setMeasurementAllowed(true);track('periodic_report_viewed');
  expect(apiRequest).not.toHaveBeenCalled();
  setMeasurementAllowed(true,'00000000-0000-4000-8000-000000000001');
  track('transaction_logged');track('planning_saved');track('trial_started');
  expect(apiRequest).not.toHaveBeenCalled();
});
it('retries transient failure with the same event ID and epoch',async()=>{
  (apiRequest as jest.Mock).mockRejectedValueOnce({status:0}).mockResolvedValueOnce({accepted:true});
  setMeasurementAllowed(true,'00000000-0000-4000-8000-000000000001');
  track('periodic_report_viewed');
  await Promise.resolve();await Promise.resolve();
  expect(apiRequest).toHaveBeenCalledTimes(2);
  expect((apiRequest as jest.Mock).mock.calls[0]).toEqual((apiRequest as jest.Mock).mock.calls[1]);
});
it('does not retry an in-flight event after logout',async()=>{
  let reject!: (value:unknown)=>void;
  (apiRequest as jest.Mock).mockReturnValueOnce(new Promise((_,r)=>{reject=r;}));
  setMeasurementAllowed(true,'00000000-0000-4000-8000-000000000001');
  track('periodic_report_viewed');resetAnalytics();reject({status:0});
  await Promise.resolve();await Promise.resolve();
  expect(apiRequest).toHaveBeenCalledTimes(1);
});

it('rejects a consent response captured before logout or another consent change',()=>{
  const revision=measurementRevision();resetAnalytics();
  expect(applyMeasurementConsent({enabled:true,consentEpoch:'old'},revision)).toBe(false);
  track('periodic_report_viewed');expect(apiRequest).not.toHaveBeenCalled();
});
