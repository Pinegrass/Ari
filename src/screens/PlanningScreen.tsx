import React,{useEffect,useRef} from 'react';
import {ActivityIndicator,AppState,Text,TextInput,TouchableOpacity,View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import ScreenShell from '../components/ScreenShell';
import {useColors} from '../context/ThemeContext';
import {usePrivacy} from '../context/PrivacyContext';
import {useLocale} from '../hooks/useLocale';
import {usePlanning} from '../hooks/usePlanning';
import {useLanguage} from '../i18n/LanguageContext';
export default function PlanningScreen(){
  const {t,language}=useLanguage(),c=useColors(),{locale}=useLocale(),{isPrivate}=usePrivacy(),nav=useNavigation();
  const p=usePlanning(locale.currency);
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
  return <ScreenShell scrollable contentContainerStyle={{padding:20,gap:16}}>
    <TouchableOpacity accessibilityRole="button" style={box} onPress={()=>nav.goBack()}><Text style={{color:c.ink}}>{t('back')}</Text></TouchableOpacity>
    <Text accessibilityRole="header" style={{fontSize:26,color:c.ink}}>{t('planning')}</Text><Text style={{color:c.inkSoft}}>{t('planningHelp')}</Text>
    {p.loading?<ActivityIndicator/>:isPrivate?<Text style={{color:c.ink}}>{t('private')}</Text>:<>
      {p.result?.estimate?<View><Text style={{color:c.ink}}>{t('planningRemaining')}: {money(p.result.estimate.remaining)}</Text><Text style={{color:c.ink}}>{t('planningDaily')}: {money(p.result.estimate.perDay)}</Text></View>:<Text style={{color:c.ink}}>{t(!p.result || p.result.status==='missing'?'planningMissing':'planningStale')}</Text>}
      {(['cash','reserve','payday'] as const).map((key,i)=><View key={key}><Text style={{color:c.ink}}>{t((['cashNow','protectedReserve','nextPayday'] as const)[i])} {key==='payday'?'':`(${locale.currency})`}</Text><TextInput editable={!p.busy} style={box} accessibilityLabel={t((['cashNow','protectedReserve','nextPayday'] as const)[i])} keyboardType={key==='payday'?'default':'decimal-pad'} value={p.form[key]} onChangeText={v=>p.change({[key]:v})}/></View>)}
      {p.form.obligations.map((row,i)=><View key={i} style={{gap:8}}>{(['amount','dueOn'] as const).map(key=><TextInput key={key} editable={!p.busy} style={box} accessibilityLabel={t(key==='amount'?'obligationAmount':'obligationDate')} placeholder={t(key==='amount'?'obligationAmount':'obligationDate')} value={row[key]} keyboardType={key==='amount'?'decimal-pad':'default'} onChangeText={v=>p.change({obligations:p.form.obligations.map((o,j)=>j===i?{...o,[key]:v}:o)})}/>)}<TouchableOpacity accessibilityRole="button" style={box} disabled={p.busy} onPress={()=>p.change({obligations:p.form.obligations.filter((_,j)=>j!==i)})}><Text style={{color:c.ink}}>{t('removeObligation')}</Text></TouchableOpacity></View>)}
      <TouchableOpacity accessibilityRole="button" style={box} disabled={p.busy||p.form.obligations.length>=50} onPress={()=>p.change({obligations:[...p.form.obligations,{amount:'',dueOn:''}]})}><Text style={{color:c.ink}}>{t('addObligation')}</Text></TouchableOpacity>
      <TouchableOpacity accessibilityRole="checkbox" accessibilityState={{checked:p.form.complete}} disabled={p.busy} style={box} onPress={()=>p.change({complete:!p.form.complete})}><Text style={{color:c.ink}}>{p.form.complete?'☑':'☐'} {t('confirmPlanning')}</Text></TouchableOpacity>
      <TouchableOpacity accessibilityRole="button" disabled={p.busy||!p.form.complete} style={box} onPress={()=>void p.save()}><Text style={{color:c.ink}}>{t('savePlanning')}</Text></TouchableOpacity>
      <TouchableOpacity accessibilityRole="button" disabled={p.busy} style={box} onPress={()=>void p.clear()}><Text style={{color:c.ink}}>{t('clearPlanning')}</Text></TouchableOpacity>
    </>}
    {p.error&&<View><Text accessibilityRole="alert" style={{color:c.ink}}>{t('planningError')}</Text><TouchableOpacity accessibilityRole="button" style={box} onPress={p.retry}><Text style={{color:c.ink}}>{t('retry')}</Text></TouchableOpacity></View>}
  </ScreenShell>;
}
