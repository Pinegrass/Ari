/* eslint-disable @typescript-eslint/no-require-imports -- Jest mock factories. */
import React from 'react';
import {render,fireEvent,waitFor} from '@testing-library/react-native';
import AddTransactionScreen from '../AddTransactionScreen';
const mockAdd=jest.fn(),mockUpdate=jest.fn(),mockDelete=jest.fn(),mockBack=jest.fn();
const mockFetch=jest.fn();
jest.mock('react-native-safe-area-context',()=>({SafeAreaView:require('react-native').View,useSafeAreaInsets:()=>({top:0,bottom:0,left:0,right:0})}));
jest.mock('../../context/DataContext',()=>({useData:()=>({addTransaction:mockAdd,updateTransaction:mockUpdate,deleteTransaction:mockDelete,userCategories:[],fetchUserCategories:mockFetch})}));
jest.mock('../../hooks/useLocale',()=>({useLocale:()=>({locale:require('../../utils/locale').getLocale('IN')})}));
jest.mock('../../hooks/useVoiceInput',()=>({useVoiceInput:()=>({transcript:'',isAvailable:false})}));
jest.mock('../../hooks/useHaptics',()=>({useHaptics:()=>({light:jest.fn(),success:jest.fn(),error:jest.fn()})}));
jest.mock('../../components/CategoryPicker',()=>()=>null);
jest.mock('../../components/ConfidenceConfirmSheet',()=>()=>null);
jest.mock('../../components/ui/Icon',()=>()=>null);
jest.mock('../../api/parse',()=>({parseExpenseAI:jest.fn()}));
jest.mock('@react-native-community/datetimepicker',()=>()=>null);
const edit={id:'qa',type:'expense',amount:125.5,category:'food',description:'QA',note:'',date:'2026-09-12'};
function screen(editing=false){return render(<AddTransactionScreen {...({navigation:{goBack:mockBack},route:{params:editing?{editTransaction:edit}:undefined}} as unknown as React.ComponentProps<typeof AddTransactionScreen>)}/>);}
beforeEach(()=>{jest.clearAllMocks();mockAdd.mockResolvedValue({ok:true});mockUpdate.mockResolvedValue({ok:true});mockDelete.mockResolvedValue(undefined);});
it('enters and saves paise from the INR keypad, preserving trailing zero display',async()=>{
 const view=screen();
 for(const key of ['1','2','5','.','5','0'])fireEvent.press(view.getByRole('button',{name:key}));
 expect(view.getByText(/125.50/)).toBeTruthy();
 fireEvent.press(view.getByLabelText('Save entry'));
 await waitFor(()=>expect(mockAdd).toHaveBeenCalledWith(expect.objectContaining({amount:125.5})));
});
it('requires delete confirmation from Edit and returns after successful deletion',async()=>{
 const view=screen(true);
 fireEvent.press(view.getByLabelText('Delete entry'));
 expect(mockDelete).not.toHaveBeenCalled();
 fireEvent.press(view.getByLabelText('Confirm deletion'));
 await waitFor(()=>expect(mockDelete).toHaveBeenCalledWith('qa'));
 expect(mockBack).toHaveBeenCalled();
});
it('keeps the edit screen and shows an error when deletion fails',async()=>{
 mockDelete.mockRejectedValue(new Error('offline'));
 const view=screen(true);
 fireEvent.press(view.getByLabelText('Delete entry'));
 fireEvent.press(view.getByLabelText('Confirm deletion'));
 await waitFor(()=>expect(view.getByText('Could not delete transaction.')).toBeTruthy());
 expect(mockBack).not.toHaveBeenCalled();
});
