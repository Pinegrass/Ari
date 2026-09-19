import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import { confirmRecurringCandidate, getRecurringCandidates, type HistoryBaseline, type PlanningOutlook, type RecurringCandidate, type ReviewEntry, type ReviewProvenance } from '../api/reviewIntelligence';
import { reviewIntelligenceCopy } from '../i18n/reviewIntelligenceCopy';
import { color } from '../theme/tokens';

export function ReviewIntelligence({ provenance, outlook, baseline, language, money, day, onEdit, onPlanning, onChanged }: {
  provenance?: ReviewProvenance; outlook?: PlanningOutlook; baseline?: HistoryBaseline; language: 'en' | 'hi';
  money: (value: number) => string; day: (value: string) => string;
  onEdit: (entry: ReviewEntry) => void; onPlanning: () => void; onChanged: () => void | Promise<void>;
}) {
  const copy = reviewIntelligenceCopy[language];
  const [expanded, setExpanded] = useState(false);
  const [limit, setLimit] = useState(20);
  const [candidates, setCandidates] = useState<RecurringCandidate[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const serial = useRef(0);
  const load = useCallback(async () => {
    const request = ++serial.current; setBusy(true); setMessage(null);
    try { const data = await getRecurringCandidates(); if (request === serial.current) setCandidates(data.candidates); }
    catch { if (request === serial.current) setMessage(copy.failure); }
    finally { if (request === serial.current) setBusy(false); }
  }, [copy.failure]);
  useEffect(() => { void load(); return () => { serial.current += 1; }; }, [load]);
  const confirm = (candidate: RecurringCandidate) => Alert.alert(copy.confirmTitle, copy.patternHelp, [
    { text: copy.cancel, style: 'cancel' }, { text: copy.confirm, onPress: () => {
      setBusy(true); setMessage(null);
      void confirmRecurringCandidate(candidate).then(async () => { await load(); await onChanged(); })
        .catch(error => { setMessage(error?.status === 409 ? copy.conflict : copy.failure); setBusy(false); });
    } },
  ]);
  const button = (label: string, action: () => void, disabled = false) => <TouchableOpacity
    accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={action}
    style={{ paddingVertical: 14, minHeight: 48 }}><Text style={{ color: color.forest, fontWeight: '600', opacity: disabled ? 0.5 : 1 }}>{label}</Text></TouchableOpacity>;
  return <View style={{ marginTop: 16, padding: 16, borderRadius: 18, backgroundColor: color.card, gap: 12 }}>
    {provenance && <>
      {button(copy.sources, () => setExpanded(value => !value))}
      {expanded && <><Text selectable>{copy.sourceHelp}</Text>{Object.entries(provenance.groups).map(([group, value]) => <View key={group} style={{ gap: 8 }}>
        <Text accessibilityRole="header" style={{ fontWeight: '600' }}>{group === 'current' ? copy.current : group === 'history' ? copy.history : copy.previous}</Text>
        {!value.entries.length && <Text>{copy.noSources}</Text>}
        {value.entries.slice(0, limit).map(entry => <View key={entry.id}>
          <Text selectable>{day(entry.date)} · {money(Number(entry.amount))} · {entry.category}</Text>
          {button(`${copy.edit}: ${entry.description || entry.category}`, () => onEdit(entry))}
        </View>)}
        {value.entries.length > limit && button(copy.more, () => setLimit(value => value + 20))}
      </View>)}</>}
    </>}
    {baseline && <View style={{ gap: 8 }}><Text accessibilityRole="header" style={{ fontWeight: '600' }}>{copy.baseline}</Text>
      <Text>{day(baseline.start)} – {day(baseline.end)}</Text><Text>{copy.historyLimit}</Text>
      {baseline.medianMonthlyRecordedSpending !== null && <Text selectable>{copy.monthlyMedian}: {money(Number(baseline.medianMonthlyRecordedSpending))}</Text>}
      {baseline.income.medianMonthlyRecorded !== null && <Text selectable>{copy.incomeMedian}: {money(Number(baseline.income.medianMonthlyRecorded))}</Text>}
      {baseline.categories.filter(item => item.medianMonthlyRecorded !== null).map(item => <Text selectable key={item.category}>{item.category}: {money(Number(item.medianMonthlyRecorded))}</Text>)}
    </View>}
    {outlook && <><Text accessibilityRole="header" style={{ fontWeight: '600' }}>{copy.outlook}</Text>
      {outlook.status === 'ready' && outlook.payday ? <>
        <Text selectable>{copy.payday}: {day(outlook.payday)}</Text>
        {outlook.obligations?.map((item, index) => <Text selectable key={index}>{copy.obligation}: {day(item.dueOn)} · {money(Number(item.amount))}</Text>)}
        {outlook.asOf && <Text selectable>{copy.confirmedAt}: {new Date(outlook.asOf).toLocaleString(language === 'hi' ? 'hi-IN' : undefined)}</Text>}
        {outlook.expiresAt && <Text selectable>{copy.expires}: {new Date(outlook.expiresAt).toLocaleString(language === 'hi' ? 'hi-IN' : undefined)}</Text>}
      </> : <Text>{outlook.status === 'historical_unavailable' ? copy.historical : copy.planMissing}</Text>}
      {button(copy.outlook, onPlanning)}
    </>}
    <Text accessibilityRole="header" style={{ fontWeight: '600' }}>{copy.patterns}</Text>
    <Text>{copy.patternHelp}</Text>
    {busy && <Text accessibilityLiveRegion="polite">{candidates === null ? copy.loading : copy.saving}</Text>}
    {message && <Text accessibilityRole="alert" selectable>{message}</Text>}
    {candidates?.length === 0 && <Text>{copy.empty}</Text>}
    {candidates?.map(candidate => <View key={candidate.id} style={{ gap: 8 }}>
      <Text selectable style={{ fontWeight: '600' }}>{candidate.label}</Text><Text>{copy.predict}</Text>
      <Text selectable>{day(candidate.expectedOn)} · {money(Number(candidate.amount))}</Text>
      <Text selectable>{candidate.sourceEntries.map(entry => day(entry.date)).join(' · ')}</Text>
      {button(copy.confirm, () => confirm(candidate), busy || message === copy.conflict)}
    </View>)}
    {button(copy.retry, () => { void load(); }, busy)}
  </View>;
}
