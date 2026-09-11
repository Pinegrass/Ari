import React,{useCallback,useState} from 'react';
import {useFocusEffect} from '@react-navigation/native';
import {Text,TouchableOpacity,View} from 'react-native';
import {apiRequest} from '../api/client';
import type {User} from '../types';
import {useAuth} from '../context/AuthContext';
import {useLanguage} from '../i18n/LanguageContext';
import {useColors} from '../context/ThemeContext';
type Trial={eligible:boolean;active:boolean;endsAt:string|null;user:User};
export default function TrialCard(){
  const {t}=useLanguage(),c=useColors(),{refreshFromSession,user}=useAuth();
  const [value,setValue]=useState<Trial|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(false),[attempt,setAttempt]=useState(0);
  useFocusEffect(useCallback(()=>{let active=true;apiRequest<Trial>('/billing/trial').then(v=>{if(active){setValue(v);setError(false);}}).catch(()=>{if(active)setError(true);});return()=>{active=false;};
  // Revalidate after an explicit retry or account change as well as navigation focus.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[attempt,user?.id]));
  return <View style={{padding:16,gap:12}}><Text style={{color:c.ink,fontSize:20}}>{t('trialTitle')}</Text><Text style={{color:c.inkSoft}}>{t('trialHelp')}</Text>{value?.active?<Text style={{color:c.ink}}>{t('trialActive')} · {value.endsAt?.slice(0,10)}</Text>:<TouchableOpacity accessibilityRole="button" disabled={!value?.eligible||busy} onPress={async()=>{setBusy(true);try{const v=await apiRequest<Trial>('/billing/trial',{method:'POST'});setValue(v);await refreshFromSession(v.user);setError(false);}catch{setError(true);}finally{setBusy(false);}}} style={{paddingVertical:16}}><Text style={{color:c.forest}}>{t(value?.eligible?'startTrial':'trialUnavailable')}</Text></TouchableOpacity>}{error&&<TouchableOpacity accessibilityRole="button" onPress={()=>setAttempt(v=>v+1)}><Text style={{color:c.ink}}>{t('trialError')} {t('retry')}</Text></TouchableOpacity>}</View>;
}
