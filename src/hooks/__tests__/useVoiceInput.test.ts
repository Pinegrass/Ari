/* eslint-disable @typescript-eslint/no-require-imports -- Jest hook factories. */
import {act,renderHook} from '@testing-library/react-native';
import {useVoiceInput} from '../useVoiceInput';
import {ExpoSpeechRecognitionModule} from 'expo-speech-recognition';
const mockHandlers:Record<string,(event:Record<string,unknown>)=>void>={};
jest.mock('expo-speech-recognition',()=>({ExpoSpeechRecognitionModule:{isRecognitionAvailable:()=>true,abort:jest.fn(),stop:jest.fn(),start:jest.fn(),requestPermissionsAsync:jest.fn()},useSpeechRecognitionEvent:(event:string,handler:(value:Record<string,unknown>)=>void)=>{mockHandlers[event]=handler;}}));
jest.mock('../useLocale',()=>({useLocale:()=>({locale:{localeTag:'en-IN'}})}));
jest.mock('../../i18n/LanguageContext',()=>({useLanguage:()=>({language:'hi',phrase:(text:string)=>require('../../i18n/phrases').phrase('hi',text)})}));
beforeEach(()=>{jest.clearAllMocks();(ExpoSpeechRecognitionModule.requestPermissionsAsync as jest.Mock).mockResolvedValue({granted:true});});
it('starts the recognizer in the selected Hindi language without changing typed transcripts',async()=>{
 const {result}=renderHook(()=>useVoiceInput());await act(async()=>{await result.current.start();});
 expect(ExpoSpeechRecognitionModule.start).toHaveBeenCalledWith(expect.objectContaining({lang:'hi-IN'}));
 act(()=>mockHandlers.result({results:[{transcript:'my own mixed text'}]}));expect(result.current.transcript).toBe('my own mixed text');
});
it('shows a safe localized permission message',async()=>{
 (ExpoSpeechRecognitionModule.requestPermissionsAsync as jest.Mock).mockResolvedValueOnce({granted:false});
 const {result}=renderHook(()=>useVoiceInput());await act(async()=>{await result.current.start();});
 expect(result.current.error).toBe('डिवाइस की सेटिंग में माइक्रोफ़ोन और आवाज़ पहचानने की अनुमति दें।');expect(ExpoSpeechRecognitionModule.start).not.toHaveBeenCalled();
});
it('never displays raw platform errors and treats a user abort as silent',()=>{
 const {result}=renderHook(()=>useVoiceInput());
 act(()=>mockHandlers.error({error:'network',message:'private platform detail'}));
 expect(result.current.error).toBe('आवाज़ समझ नहीं आई। फिर कोशिश करें।');
 act(()=>result.current.reset());act(()=>mockHandlers.error({error:'aborted',message:'private detail'}));expect(result.current.error).toBeNull();
});
