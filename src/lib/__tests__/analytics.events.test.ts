import {apiRequest} from '../../api/client';
import {track,setPrivacyEnabled,setMeasurementAllowed} from '../analytics';
jest.mock('../../api/client',()=>({apiRequest:jest.fn().mockResolvedValue({accepted:true})}));
beforeEach(()=>{jest.clearAllMocks();setPrivacyEnabled(false);setMeasurementAllowed(true);});
it('forwards approved action and conversion names without properties',()=>{
  for(const event of ['report_action_started','planning_saved','trial_started'] as const){
    track(event,{amount:123,privateText:'never send'});
    expect(apiRequest).toHaveBeenLastCalledWith('/measurement/events',{method:'POST',body:JSON.stringify({event})});
  }
});
it('does not measure without consent or in private mode',()=>{
  setMeasurementAllowed(false);track('trial_started');
  setMeasurementAllowed(true);setPrivacyEnabled(true);track('planning_saved');
  expect(apiRequest).not.toHaveBeenCalled();
});
