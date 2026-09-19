import React from 'react';
import {render,waitFor,fireEvent,act} from '@testing-library/react-native';
import ShareCaptureScreen from '../ShareCaptureScreen';
import {parseExpenseAI} from '../../api/parse';
const mockAdd=jest.fn();
jest.mock('../../api/parse',()=>({parseExpenseAI:jest.fn()}));
jest.mock('../../context/DataContext',()=>({useData:()=>({addTransaction:mockAdd})}));
jest.mock('../../context/PrivacyContext',()=>({usePrivacy:()=>({formatAmount:()=> '••••'})}));
jest.mock('../../components/ScreenShell',()=>({children}:{children:React.ReactNode})=>children);
it('preserves decimal parsed amounts, masks preview and navigates only after save',async()=>{
 (parseExpenseAI as jest.Mock).mockResolvedValue({amount:12.34,type:'expense',category:'food',description:'Lunch',confidence:0.9});
 mockAdd.mockResolvedValue({ok:true});const goBack=jest.fn();
 const screen=render(<ShareCaptureScreen navigation={{goBack,replace:jest.fn()} as never} route={{params:{text:'Lunch'}} as never}/>);
 await waitFor(()=>expect(screen.getByText('••••')).toBeTruthy());
 expect(screen.queryByText('12.34')).toBeNull();fireEvent.press(screen.getByText('Add entry'));
 await waitFor(()=>expect(mockAdd).toHaveBeenCalledWith(expect.objectContaining({amount:12.34})));
 await waitFor(()=>expect(goBack).toHaveBeenCalledTimes(1));
});

it('does not navigate after an in-flight save resolves on a dismissed screen',async()=>{
 let resolveSave!: (value: {ok:boolean})=>void;
 (parseExpenseAI as jest.Mock).mockResolvedValue({amount:12.34,type:'expense',category:'food',description:'Lunch'});
 mockAdd.mockImplementation(()=>new Promise(resolve=>{resolveSave=resolve;}));
 const goBack=jest.fn();
 const screen=render(<ShareCaptureScreen navigation={{goBack,replace:jest.fn()} as never} route={{params:{text:'Lunch'}} as never}/>);
 await waitFor(()=>expect(screen.getByText('Add entry')).toBeTruthy());
 fireEvent.press(screen.getByText('Add entry'));screen.unmount();
 await act(async()=>{resolveSave({ok:true});await Promise.resolve();});
 expect(goBack).not.toHaveBeenCalled();
});
