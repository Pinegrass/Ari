import React,{useEffect,useRef,useState} from 'react';
import {Text,TouchableOpacity,View} from 'react-native';
import {getMeasurementConsent,saveMeasurementConsent} from '../api/product';
import {setMeasurementAllowed,measurementRevision,applyMeasurementConsent} from '../lib/analytics';
import {useLanguage} from '../i18n/LanguageContext';
import {useColors} from '../context/ThemeContext';
export default function MeasurementConsent(){
  const {t}=useLanguage(),c=useColors();
  const [enabled,setEnabled]=useState(false),[busy,setBusy]=useState(true),[error,setError]=useState(false),[attempt,setAttempt]=useState(0);
  const mounted=useRef(false);
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
  useEffect(()=>{
    let active=true;setBusy(true);
    const revision=measurementRevision();
    getMeasurementConsent().then(value=>{
      if(active&&applyMeasurementConsent(value,revision)){setEnabled(value.enabled);setError(false);}
      else if(active)setError(true);
    }).catch(()=>{if(active)setError(true);}).finally(()=>{if(active)setBusy(false);});
    return()=>{active=false;};
  },[attempt]);
  const toggle=async()=>{
    setBusy(true);setMeasurementAllowed(false);
    const revision=measurementRevision();
    try{
      const value=await saveMeasurementConsent(!enabled);
      if(mounted.current&&applyMeasurementConsent(value,revision)){setEnabled(value.enabled);setError(false);}
      else if(mounted.current)setError(true);
    }catch{if(mounted.current)setError(true);}
    finally{if(mounted.current)setBusy(false);}
  };
  return <View style={{padding:16,gap:12}}>
    <Text style={{color:c.ink,fontWeight:'700'}}>{t('measurementTitle')}</Text>
    <Text style={{color:c.inkSoft}}>{t('measurementHelp')}</Text>
    <TouchableOpacity accessibilityRole="switch" accessibilityLabel={t('measurementTitle')} accessibilityState={{checked:enabled,disabled:busy}} disabled={busy} onPress={()=>void toggle()}>
      <Text style={{color:c.forest,paddingVertical:12}}>{t(enabled?'measurementOn':'measurementOff')}</Text>
    </TouchableOpacity>
    {error&&<View><Text accessibilityRole="alert" style={{color:c.inkSoft}}>{t('measurementError')}</Text><TouchableOpacity disabled={busy} accessibilityRole="button" onPress={()=>setAttempt(v=>v+1)}><Text style={{color:c.ink,paddingVertical:12}}>{t('retry')}</Text></TouchableOpacity></View>}
  </View>;
}
