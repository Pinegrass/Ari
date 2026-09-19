/* eslint-disable @typescript-eslint/no-require-imports -- Isolated native component mocks. */
import React from 'react';
import {render,waitFor,fireEvent} from '@testing-library/react-native';
import TodoNotesScreen from '../TodoNotesScreen';
import ManageCategoriesScreen from '../ManageCategoriesScreen';
import {getTodos} from '../../api/todos';
import {getCategories} from '../../api/categories';
import {phrase} from '../../i18n/phrases';
jest.setTimeout(20000);
jest.mock('react-native-safe-area-context',()=>({useSafeAreaInsets:()=>({top:0,bottom:0,left:0,right:0})}));
jest.mock('../../api/todos',()=>({getTodos:jest.fn()}));
jest.mock('../../api/categories',()=>({getCategories:jest.fn()}));
jest.mock('../../hooks/useLocale',()=>({useLocale:()=>({locale:{localeTag:'en-IN'}})}));
jest.mock('../../components/ScreenShell',()=>({children}:{children:React.ReactNode})=>children);
jest.mock('../../components/ui/AnimatedEntry',()=>({children}:{children:React.ReactNode})=>children);
jest.mock('../../hooks/useHaptics',()=>({useHaptics:()=>({light:jest.fn(),medium:jest.fn(),success:jest.fn(),error:jest.fn()})}));
jest.mock('@react-navigation/native',()=>({useNavigation:()=>({goBack:jest.fn()}),useFocusEffect:(effect:()=>void)=>require('react').useEffect(effect,[effect])}));
beforeEach(()=>jest.clearAllMocks());
it('does not turn a failed notes request into a false empty state, and retries',async()=>{
 (getTodos as jest.Mock).mockRejectedValueOnce(new Error('internal')).mockResolvedValueOnce([]);
 const screen=render(<TodoNotesScreen/>);
 await waitFor(()=>expect(screen.getByText('Could not load notes.')).toBeTruthy());
 expect(screen.queryByText('No notes yet')).toBeNull();
 fireEvent.press(screen.getByText('Retry'));
 await waitFor(()=>expect(screen.getByText('No notes yet')).toBeTruthy());
 expect(getTodos).toHaveBeenCalledTimes(2);
});
it('keeps a categories fetch stable across renders',async()=>{
 (getCategories as jest.Mock).mockResolvedValue([]);
 const screen=render(<ManageCategoriesScreen onBack={jest.fn()}/>);
 await waitFor(()=>expect(screen.getByText('Add Custom Category')).toBeTruthy());
 screen.rerender(<ManageCategoriesScreen onBack={jest.fn()}/>);
 expect(getCategories).toHaveBeenCalledTimes(1);
});
it('localizes corrected product and payment claims without translating identifiers',()=>{
 for(const text of ['Could not load notes.','Store listing unavailable','India','Across {count} groups · Tap to settle'])expect(phrase('hi',text)).toMatch(/[\u0900-\u097f]/);
 expect(phrase('hi','name@ybl')).toBe('name@ybl');
});
