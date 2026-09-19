import {apiRequest} from '../../api/client';
import {track,setPrivacyEnabled,setMeasurementAllowed} from '../analytics';
jest.mock('expo-crypto',()=>({randomUUID:()=> '00000000-0000-4000-8000-000000000002'}));
jest.mock('../../api/client',()=>({apiRequest:jest.fn().mockResolvedValue({accepted:true})}));
beforeEach(()=>{jest.clearAllMocks();setPrivacyEnabled(false);setMeasurementAllowed(true,'00000000-0000-4000-8000-000000000001');});
it('forwards approved action and conversion names without properties',()=>{
  for(const event of ['report_action_started','notification_preferences_updated'] as const){
    track(event,{amount:123,privateText:'never send'});
    expect(apiRequest).toHaveBeenLastCalledWith('/measurement/v2/events',{method:'POST',body:JSON.stringify({event,eventId:'00000000-0000-4000-8000-000000000002',consentEpoch:'00000000-0000-4000-8000-000000000001'})});
  }
});
it('does not measure without consent or in private mode',()=>{
  setMeasurementAllowed(false);track('trial_started');
  setMeasurementAllowed(true,'00000000-0000-4000-8000-000000000001');setPrivacyEnabled(true);track('planning_saved');
  expect(apiRequest).not.toHaveBeenCalled();
});
