import React,{useEffect,useRef,useState} from 'react';
import {ActivityIndicator,AppState,ScrollView,Platform,Text,TextInput,TouchableOpacity,View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import {validatePlanning} from '../utils/planningValidation';
import {toLocalISODate} from '../utils/dateHelpers';
import ScreenShell from '../components/ScreenShell';
import {useColors} from '../context/ThemeContext';
import {usePrivacy} from '../context/PrivacyContext';
import {useLocale} from '../hooks/useLocale';
import {usePlanning} from '../hooks/usePlanning';
import {useLanguage} from '../i18n/LanguageContext';
export default function PlanningScreen(){
  const {t,language}=useLanguage(),c=useColors(),{locale}=useLocale(),{isPrivate}=usePrivacy(),nav=useNavigation();
  const p=usePlanning(locale.currency);
  const [submitted,setSubmitted]=useState(false);
  const [dateField,setDateField]=useState<'payday'|number|null>(null);
  const scroll=useRef<ScrollView>(null),positions=useRef<Record<string,number>>({});
  const errors=submitted?validatePlanning(p.form):{};
  const submit=()=>{setSubmitted(true);const found=validatePlanning(p.form);const first=Object.keys(found)[0];if(first){scroll.current?.scrollTo({y:positions.current[first]??0,animated:true});return;}void p.save();};
  const fieldError=(key:string)=>errors[key]?<Text accessibilityRole="alert" style={{color:c.clay}}>{t(errors[key])}</Text>:null;
  const dateButton=(key:'payday'|number,value:string,label:string)=><TouchableOpacity accessibilityRole="button" accessibilityLabel={label} disabled={p.busy} style={box} onPress={()=>setDateField(key)}><Text style={{color:c.ink}}>{value?new Date(value+'T12:00:00').toLocaleDateString(language==='hi'?'hi-IN':locale.localeTag):t('selectDate')}</Text></TouchableOpacity>;
  const selectedDate=dateField==='payday'?p.form.payday:dateField!==null?p.form.obligations[dateField]?.dueOn:'';
  const minimumDate=new Date();minimumDate.setHours(0,0,0,0);if(dateField==='payday')minimumDate.setDate(minimumDate.getDate()+1);
  const maximumDate=new Date();maximumDate.setDate(maximumDate.getDate()+90);
  const pickerDate=selectedDate?new Date(selectedDate+'T12:00:00'):minimumDate;
  const invalidate = useRef(p.invalidate);
  invalidate.current = p.invalidate;
  useEffect(()=>{
    const subscription = AppState.addEventListener('change', state=>{
      if (state !== 'active') invalidate.current();
    });
    return ()=>subscription.remove();
  },[]);
  const money=(v:string)=>new Intl.NumberFormat(language==='hi'?'hi-IN':locale.localeTag,{style:'currency',currency:locale.currency}).format(Number(v));
  const box={padding:14,borderRadius:10,borderWidth:1,borderColor:c.line,color:c.ink};
  return <ScreenShell><ScrollView ref={scroll} keyboardShouldPersistTaps="handled" contentContainerStyle={{padding:20,gap:16}}>
    <TouchableOpacity accessibilityRole="button" style={box} onPress={()=>nav.goBack()}><Text style={{color:c.ink}}>{t('back')}</Text></TouchableOpacity>
    <Text accessibilityRole="header" style={{fontSize:26,color:c.ink}}>{t('planning')}</Text><Text style={{color:c.inkSoft}}>{t('planningHelp')}</Text>
    {p.loading?<ActivityIndicator/>:isPrivate?<Text style={{color:c.ink}}>{t('private')}</Text>:<>
      {p.result?.estimate?<View><Text style={{color:c.ink}}>{t('planningRemaining')}: {money(p.result.estimate.remaining)}</Text><Text style={{color:c.ink}}>{t('planningDaily')}: {money(p.result.estimate.perDay)}</Text></View>:<Text style={{color:c.ink}}>{t(!p.result || p.result.status==='missing'?'planningMissing':'planningStale')}</Text>}
      {(['cash','reserve','payday'] as const).map((key,i)=><View key={key} onLayout={e=>{positions.current[key]=e.nativeEvent.layout.y;}}><Text style={{color:c.ink}}>{t((['cashNow','protectedReserve','nextPayday'] as const)[i])} {key==='payday'?'':`(${locale.currency})`}</Text>{key==='payday'?dateButton('payday',p.form.payday,t('nextPayday')):<TextInput editable={!p.busy} style={box} accessibilityLabel={t((['cashNow','protectedReserve','nextPayday'] as const)[i])} keyboardType="decimal-pad" value={p.form[key]} onChangeText={v=>p.change({[key]:v})}/>} {fieldError(key)}</View>)}
      {p.form.obligations.map((row,i)=><View key={i} style={{gap:8}} onLayout={e=>{positions.current[`amount${i}`]=e.nativeEvent.layout.y;positions.current[`dueOn${i}`]=e.nativeEvent.layout.y;}}>{(['amount','dueOn'] as const).map(key=><View key={key}>{key==='dueOn'?dateButton(i,row.dueOn,t('obligationDate')):<TextInput editable={!p.busy} style={box} accessibilityLabel={t(key==='amount'?'obligationAmount':'obligationDate')} placeholder={t(key==='amount'?'obligationAmount':'obligationDate')} value={row[key]} keyboardType="decimal-pad" onChangeText={v=>p.change({obligations:p.form.obligations.map((o,j)=>j===i?{...o,[key]:v}:o)})}/>} {fieldError(`${key}${i}`)}</View>)}<TouchableOpacity accessibilityRole="button" style={box} disabled={p.busy} onPress={()=>p.change({obligations:p.form.obligations.filter((_,j)=>j!==i)})}><Text style={{color:c.ink}}>{t('removeObligation')}</Text></TouchableOpacity></View>)}
      <TouchableOpacity accessibilityRole="button" style={box} disabled={p.busy||p.form.obligations.length>=50} onPress={()=>p.change({obligations:[...p.form.obligations,{amount:'',dueOn:''}]})}><Text style={{color:c.ink}}>{t('addObligation')}</Text></TouchableOpacity>
      <View onLayout={e=>{positions.current.complete=e.nativeEvent.layout.y;}}>{fieldError('complete')}</View><TouchableOpacity accessibilityRole="checkbox" accessibilityState={{checked:p.form.complete}} disabled={p.busy} style={box} onPress={()=>p.change({complete:!p.form.complete})}><Text style={{color:c.ink}}>{p.form.complete?'☑':'☐'} {t('confirmPlanning')}</Text></TouchableOpacity>
      <TouchableOpacity accessibilityRole="button" disabled={p.busy||!p.form.complete} style={box} onPress={submit}><Text style={{color:c.ink}}>{t('savePlanning')}</Text></TouchableOpacity>
      <TouchableOpacity accessibilityRole="button" disabled={p.busy} style={box} onPress={()=>void p.clear()}><Text style={{color:c.ink}}>{t('clearPlanning')}</Text></TouchableOpacity>
    </>}
    {p.error&&<View><Text accessibilityRole="alert" style={{color:c.ink}}>{t('planningRequestError')}</Text><TouchableOpacity accessibilityRole="button" style={box} disabled={p.busy} onPress={()=>{if(p.errorOperation==='save')submit();else p.retry();}}><Text style={{color:c.ink}}>{t('retry')}</Text></TouchableOpacity></View>}
    {dateField!==null && !isPrivate && <DateTimePicker mode="date" value={Number.isFinite(pickerDate.getTime())?pickerDate:minimumDate} minimumDate={minimumDate} maximumDate={dateField==='payday'?maximumDate:undefined} onChange={(event,date)=>{if(Platform.OS==='android'||event.type==='dismissed')setDateField(null);if(event.type==='set'&&date){const value=toLocalISODate(date);if(dateField==='payday')p.change({payday:value});else p.change({obligations:p.form.obligations.map((row,i)=>i===dateField?{...row,dueOn:value}:row)});}}} />}
    {dateField!==null&&Platform.OS==='ios'&&<TouchableOpacity accessibilityRole="button" onPress={()=>setDateField(null)}><Text>{t('save')}</Text></TouchableOpacity>}
  </ScrollView></ScreenShell>;
}
