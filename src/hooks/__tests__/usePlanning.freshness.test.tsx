import {act,renderHook,waitFor} from '@testing-library/react-native';
import {usePlanning} from '../usePlanning';
import {getPlanning,savePlanning} from '../../api/product';
import {track} from '../../lib/analytics';
jest.mock('../../api/product',()=>({getPlanning:jest.fn(),savePlanning:jest.fn(),deletePlanning:jest.fn()}));
jest.mock('../../lib/analytics',()=>({track:jest.fn()}));
const ready={inputs:null,status:'ready',confirmedAt:new Date().toISOString(),expiresAt:new Date(Date.now()+60000).toISOString(),estimate:{remaining:'700',obligations:'200',days:4,perDay:'175'}};
beforeEach(()=>{jest.clearAllMocks();(getPlanning as jest.Mock).mockResolvedValue({inputs:null,status:'missing',estimate:null});});
it('ignores a save response after background invalidation but counts the completed save',async()=>{
  let finish!:(value:typeof ready)=>void;
  (savePlanning as jest.Mock).mockReturnValue(new Promise(resolve=>{finish=resolve;}));
  const {result}=renderHook(()=>usePlanning('INR'));
  await waitFor(()=>expect(result.current.loading).toBe(false));
  let pending!:Promise<void>;
  act(()=>{pending=result.current.save();});
  act(()=>result.current.invalidate());
  await act(async()=>{finish(ready);await pending;});
  expect(result.current.result?.estimate).toBeFalsy();
  expect(track).toHaveBeenCalledTimes(1);
  expect(track).toHaveBeenCalledWith('planning_saved');
});
it('withholds an estimate after its server deadline, even before 24 hours',async()=>{
  (getPlanning as jest.Mock).mockResolvedValue({...ready,expiresAt:new Date(Date.now()-1000).toISOString()});
  const {result}=renderHook(()=>usePlanning('INR'));
  await waitFor(()=>expect(result.current.result?.status).toBe('stale'));
  expect(result.current.result?.estimate).toBeNull();
});
it('does not count a rejected save',async()=>{
  (savePlanning as jest.Mock).mockRejectedValue(new Error('offline'));
  const {result}=renderHook(()=>usePlanning('INR'));
  await waitFor(()=>expect(result.current.loading).toBe(false));
  await act(async()=>{await result.current.save();});
  expect(result.current.error).toBe(true);
  expect(track).not.toHaveBeenCalled();
});
it('revalidates when the dashboard ledger revision changes',async()=>{
  (getPlanning as jest.Mock).mockResolvedValueOnce(ready).mockResolvedValueOnce({inputs:null,status:'entries_changed',estimate:null});
  const {result,rerender}=renderHook<ReturnType<typeof usePlanning>,{revision:string}>(({revision})=>usePlanning('INR',revision),{initialProps:{revision:'first'}});
  await waitFor(()=>expect(result.current.result?.estimate?.remaining).toBe('700'));
  rerender({revision:'second'});
  await waitFor(()=>expect(result.current.result?.status).toBe('entries_changed'));
  expect(result.current.result?.estimate).toBeNull();
  expect(getPlanning).toHaveBeenCalledTimes(2);
});

it('retries a failed save with the current draft without reloading saved inputs',async()=>{
 (savePlanning as jest.Mock).mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(ready);
 const {result}=renderHook(()=>usePlanning('INR'));
 await waitFor(()=>expect(result.current.loading).toBe(false));
 act(()=>result.current.change({cash:'1000',reserve:'0',complete:true}));
 await act(async()=>{await result.current.save();});
 act(()=>result.current.change({cash:'1250.50',complete:true}));
 await act(async()=>result.current.retry());
 expect(getPlanning).toHaveBeenCalledTimes(1);
 expect(savePlanning).toHaveBeenLastCalledWith(expect.objectContaining({cash:'1250.50',complete:true}));
 expect(result.current.form.cash).toBe('1250.50');
});
it('preserves edits across a reload and does not show an estimate for the old inputs',async()=>{
 const {result,rerender}=renderHook<ReturnType<typeof usePlanning>,{revision:string}>(({revision})=>usePlanning('INR',revision),{initialProps:{revision:'a'}});
 await waitFor(()=>expect(result.current.loading).toBe(false));
 act(()=>result.current.change({cash:'1200'}));
 (getPlanning as jest.Mock).mockResolvedValue(ready);
 rerender({revision:'b'});
 await waitFor(()=>expect(getPlanning).toHaveBeenCalledTimes(2));
 expect(result.current.form.cash).toBe('1200');
 expect(result.current.result?.estimate).toBeFalsy();
});
