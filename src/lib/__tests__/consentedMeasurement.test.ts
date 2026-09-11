import {apiRequest} from '../../api/client';
import {setMeasurementAllowed,setPrivacyEnabled,track,resetAnalytics} from '../analytics';
jest.mock('../../api/client',()=>({apiRequest:jest.fn().mockResolvedValue({})}));
beforeEach(()=>{jest.clearAllMocks();resetAnalytics();setPrivacyEnabled(false);});
it('requires explicit consent and never transmits financial properties',()=>{
  track('periodic_report_viewed',{amount:999,merchant:'private'});
  expect(apiRequest).not.toHaveBeenCalled();
  setMeasurementAllowed(true);
  track('periodic_report_viewed',{amount:999,merchant:'private'});
  expect(apiRequest).toHaveBeenCalledWith('/measurement/events',{method:'POST',body:'{"event":"report_opened"}'});
});
it('blocks collection in private mode and after withdrawal or logout',()=>{
  setMeasurementAllowed(true);setPrivacyEnabled(true);track('periodic_report_viewed');
  expect(apiRequest).not.toHaveBeenCalled();
  setPrivacyEnabled(false);setMeasurementAllowed(false);track('periodic_report_viewed');
  expect(apiRequest).not.toHaveBeenCalled();
  setMeasurementAllowed(true);resetAnalytics();track('periodic_report_viewed');
  expect(apiRequest).not.toHaveBeenCalled();
});
