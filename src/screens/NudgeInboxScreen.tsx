import React, {useCallback, useRef, useState} from 'react';
import {ActivityIndicator, Text, TouchableOpacity, View} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import type {StackNavigationProp} from '@react-navigation/stack';
import ScreenShell from '../components/ScreenShell';
import {useColors} from '../context/ThemeContext';
import {useLanguage} from '../i18n/LanguageContext';
import {getNudgeInbox, dismissInboxNudge, type InboxNudge} from '../api/nudges';
import type {MainStackParamList} from '../navigation/navigationTypes';
import {track} from '../lib/analytics';

export default function NudgeInboxScreen() {
  const {t,language} = useLanguage();
  const c=useColors();
  const navigation=useNavigation<StackNavigationProp<MainStackParamList>>();
  const [items,setItems]=useState<InboxNudge[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState(false);
  const [dismissError,setDismissError]=useState(false);
  const [busy,setBusy]=useState<string|null>(null);
  const sequence=useRef(0);
  const load=useCallback(async()=>{
    const id=++sequence.current; setLoading(true); setError(false); setDismissError(false); setItems([]);
    try {const value=await getNudgeInbox(language); if(id===sequence.current) setItems(value.items);}
    catch {if(id===sequence.current) setError(true);}
    finally {if(id===sequence.current) setLoading(false);}
  },[language]);
  useFocusEffect(useCallback(()=>{void load();return()=>{sequence.current++;};},[load]));
  const open=(item:InboxNudge)=>{
    track('nudge_opened',{action:item.action,source:'updates'});
    if(item.action==='report' && item.period && item.anchor) navigation.navigate('PeriodicReports',{period:item.period,anchor:item.anchor});
    else navigation.navigate(item.action==='recurring'?'RecurringPayments':'SmartLedger');
  };
  return <ScreenShell edges={['top']} scrollable backgroundColor={c.cream} contentContainerStyle={{padding:20,gap:16}}>
    <TouchableOpacity accessibilityRole="button" onPress={()=>navigation.goBack()} style={{paddingVertical:12}}><Text style={{color:c.ink}}>{t('back')}</Text></TouchableOpacity>
    <Text accessibilityRole="header" style={{fontSize:26,fontWeight:'700',color:c.ink}}>{t('updates')}</Text>
    <Text style={{color:c.inkSoft}}>{t('updatesHelp')}</Text>
    {loading?<ActivityIndicator accessibilityLabel={t('updatesLoading')} color={c.forest}/>:error?<View><Text accessibilityRole="alert" style={{color:c.ink}}>{t('updatesError')}</Text><TouchableOpacity accessibilityRole="button" onPress={()=>void load()} style={{paddingVertical:16}}><Text style={{color:c.ink}}>{t('retry')}</Text></TouchableOpacity></View>:!items.length?<Text style={{color:c.inkSoft}}>{t('updatesEmpty')}</Text>:items.map(item=><View key={item.id} style={{padding:18,gap:12,backgroundColor:c.card,borderColor:c.line,borderWidth:1,borderRadius:16}}>
      <Text style={{fontSize:18,fontWeight:'600',color:c.ink}}>{item.title}</Text><Text style={{color:c.inkSoft}}>{item.body}</Text>
      <View style={{flexDirection:'row',gap:24,flexWrap:'wrap'}}><TouchableOpacity accessibilityRole="button" onPress={()=>open(item)} style={{paddingVertical:12}}><Text style={{color:c.forest}}>{t('openUpdate')}</Text></TouchableOpacity>
      <TouchableOpacity accessibilityRole="button" disabled={busy!==null} accessibilityState={{disabled:busy!==null}} onPress={async()=>{
        const request=sequence.current;setBusy(item.id);setDismissError(false);
        try {await dismissInboxNudge(item.id);if(request===sequence.current){setItems(rows=>rows.filter(row=>row.id!==item.id));track('nudge_dismissed',{source:'updates'});}}
        catch {if(request===sequence.current)setDismissError(true);}finally{setBusy(null);}
      }} style={{paddingVertical:12}}><Text style={{color:c.inkSoft}}>{t('dismissUpdate')}</Text></TouchableOpacity></View>
    </View>)}
    {dismissError&&<Text accessibilityRole="alert" style={{color:c.ink}}>{t('dismissFailed')}</Text>}
  </ScreenShell>;
}
