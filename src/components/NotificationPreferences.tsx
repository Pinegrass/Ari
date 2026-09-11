import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { getNotificationPreferences, saveNotificationPreferences, type NotificationPreferences as Preferences } from '../api/notificationPreferences';
import { useLanguage } from '../i18n/LanguageContext';
import { track } from '../lib/analytics';

export default function NotificationPreferences() {
  const { t, language } = useLanguage();
  const [value, setValue] = useState<Preferences | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    getNotificationPreferences().then(v => { if (active) setValue(v); }).catch(() => { if (active) setMessage('notificationUnavailable'); });
    return () => { active = false; };
  }, [attempt]);
  return <View style={{ padding: 16, backgroundColor: '#fff', borderRadius: 16, marginVertical: 16, gap: 12 }}>
    <Text style={{ fontSize: 18 }}>{t('notifications')}</Text><Text>{t('notificationHelp')}</Text>
    {!value && !message && <ActivityIndicator />}
    {value && <>
      {(['push', 'inApp'] as const).map(key => <TouchableOpacity key={key} disabled={busy} accessibilityRole="checkbox" accessibilityState={{ checked: value[key] }} onPress={() => setValue({ ...value, [key]: !value[key] })} style={{ paddingVertical: 10 }}><Text>{value[key] ? '☑' : '☐'} {t(key)}</Text></TouchableOpacity>)}
      {(['reports', 'spending', 'bills', 'habit'] as const).map(key => <TouchableOpacity key={key} disabled={busy} accessibilityRole="checkbox" accessibilityState={{ checked: value.categories[key] }} onPress={() => setValue({ ...value, categories: { ...value.categories, [key]: !value.categories[key] } })} style={{ paddingVertical: 10 }}><Text>{value.categories[key] ? '☑' : '☐'} {t(`${key}Notice`)}</Text></TouchableOpacity>)}
      {(['maxPerWeek', 'quietStart', 'quietEnd'] as const).map(key => <View key={key}><Text>{t(key)}{key === 'maxPerWeek' ? ' (0–7)' : ' (0–23)'}</Text><TextInput editable={!busy} accessibilityLabel={t(key)} keyboardType="number-pad" value={String(value[key])} onChangeText={text => setValue({ ...value, [key]: /^\d{1,2}$/.test(text) ? Number(text) : 0 })} style={{ borderWidth: 1, borderColor: '#aaa', padding: 12, borderRadius: 8 }} /></View>)}
      <Text>{t('timezone')}</Text><TextInput editable={!busy} accessibilityLabel={t('timezone')} autoCapitalize="none" value={value.timezone} onChangeText={timezone => setValue({ ...value, timezone })} style={{ borderWidth: 1, borderColor: '#aaa', padding: 12, borderRadius: 8 }} />
      <TouchableOpacity disabled={busy} accessibilityRole="button" onPress={async () => {
        setBusy(true); setMessage('');
        try { setValue(await saveNotificationPreferences({ ...value, language })); setMessage('saved'); track('notification_preferences_updated', {}); }
        catch { setMessage('error'); } finally { setBusy(false); }
      }} style={{ padding: 16, backgroundColor: '#e8eddf', borderRadius: 8 }}><Text>{t('save')}</Text></TouchableOpacity>
    </>}
    {!!message && <Text accessibilityRole="alert">{t(message as 'saved' | 'error' | 'notificationUnavailable')}</Text>}
    {!value && !!message && <TouchableOpacity accessibilityRole="button" onPress={() => { setMessage(''); setAttempt(v => v + 1); }} style={{ paddingVertical: 12 }}><Text>{t('retry')}</Text></TouchableOpacity>}
  </View>;
}
