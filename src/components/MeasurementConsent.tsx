import React,{useEffect,useState} from 'react';
import {Text,TouchableOpacity,View} from 'react-native';
import {getMeasurementConsent,saveMeasurementConsent} from '../api/product';
import {setMeasurementAllowed} from '../lib/analytics';
import {useLanguage} from '../i18n/LanguageContext';
import {useColors} from '../context/ThemeContext';
export default function MeasurementConsent(){
  const {t}=useLanguage(),c=useColors();const [enabled,setEnabled]=useState(false),[busy,setBusy]=useState(true),[error,setError]=useState(false),[attempt,setAttempt]=useState(0);
  useEffect(()=>{let active=true;getMeasurementConsent().then(v=>{if(active){setEnabled(v.enabled);setMeasurementAllowed(v.enabled);setError(false);}}).catch(()=>{if(active)setError(true);}).finally(()=>{if(active)setBusy(false);});return()=>{active=false;};},[attempt]);
  return <View style={{padding:16,gap:12}}><Text style={{color:c.ink,fontWeight:'700'}}>{t('measurementTitle')}</Text><Text style={{color:c.inkSoft}}>{t('measurementHelp')}</Text><TouchableOpacity accessibilityRole="switch" accessibilityState={{checked:enabled,disabled:busy}} disabled={busy} onPress={async()=>{setBusy(true);if(enabled)setMeasurementAllowed(false);try{const v=await saveMeasurementConsent(!enabled);setEnabled(v.enabled);setMeasurementAllowed(v.enabled);setError(false);}catch{setError(true);}finally{setBusy(false);}}}><Text style={{color:c.forest,paddingVertical:12}}>{t(enabled?'measurementOn':'measurementOff')}</Text></TouchableOpacity>{error&&<TouchableOpacity accessibilityRole="button" onPress={()=>setAttempt(v=>v+1)}><Text style={{color:c.ink}}>{t('retry')}</Text></TouchableOpacity>}</View>;
}
