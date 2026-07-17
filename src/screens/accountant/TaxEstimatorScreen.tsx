import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import ScreenShell from '../../components/ScreenShell';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Icon from '../../components/ui/Icon';
import AnimatedEntry from '../../components/ui/AnimatedEntry';
import { color, font } from '../../theme/tokens';
import { useAuth } from '../../context/AuthContext';
import { useHaptics } from '../../hooks/useHaptics';
import * as taxApi from '../../api/taxProfile';
import type { TaxEstimate } from '../../types';
import { getTaxEngine } from '../../utils/taxCalculator';
import { formatCurrency, getLocale } from '../../utils/locale';

const numVal = (s: string): number => {
  const n = parseInt(s.replace(/[^0-9]/g, ''), 10);
  return isNaN(n) ? 0 : n;
};

const fmtInput = (n: number): string => (n > 0 ? n.toString() : '');

type Section = 'income' | 'deductions' | 'result';

export default function TaxEstimatorScreen() {
  const navigation = useNavigation();
  const haptics = useHaptics();
  const { user } = useAuth();
  const country = user?.country || 'IN';
  const loc = getLocale(country);
  const fmt = (n: number) => formatCurrency(n, loc);
  const engine = useMemo(() => getTaxEngine(country), [country]);
  const isIndia = country === 'IN';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedSection, setExpandedSection] = useState<Section>('income');

  // Generic fields (all countries)
  const [annualSalary, setAnnualSalary] = useState('');
  const [freelanceIncome, setFreelanceIncome] = useState('');
  const [otherIncome, setOtherIncome] = useState('');
  const [retirementContrib, setRetirementContrib] = useState('');
  const [otherDeductions, setOtherDeductions] = useState('');

  // India-specific
  const [hraReceived, setHraReceived] = useState('');
  const [rentPaid, setRentPaid] = useState('');
  const [regime, setRegime] = useState<'old' | 'new'>('new');

  const [estimate, setEstimate] = useState<TaxEstimate | null>(null);
  const [comparison, setComparison] = useState<any>(null);

  // Load
  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        try {
          const profile = await taxApi.getTaxProfile();
          if (profile && active) {
            setAnnualSalary(fmtInput(profile.annualSalary));
            setFreelanceIncome(fmtInput(profile.freelanceIncome));
            setOtherIncome(fmtInput(profile.otherIncome));
            setRentPaid(fmtInput(profile.rentPaid));
            if (isIndia) {
              setRegime(profile.regime || 'new');
              setHraReceived(fmtInput(profile.hraReceived));
              setRetirementContrib(fmtInput(profile.section80c));
              setOtherDeductions(fmtInput(profile.section80d));
            } else {
              setRetirementContrib(fmtInput(profile.section80c || profile.otherDeductions));
            }
          }
        } catch { /* fresh */ }
        finally { if (active) setLoading(false); }
      })();
      return () => { active = false; };
    }, [isIndia])
  );

  // Recalculate
  useEffect(() => {
    const gross = numVal(annualSalary) + numVal(freelanceIncome) + numVal(otherIncome);
    if (gross <= 0) { setEstimate(null); setComparison(null); return; }
    const input = {
      annualSalary: numVal(annualSalary), freelanceIncome: numVal(freelanceIncome),
      otherIncome: numVal(otherIncome), retirementContributions: numVal(retirementContrib),
      otherDeductions: numVal(otherDeductions), rentPaid: numVal(rentPaid),
    };
    setEstimate(engine.calculate(input));
    if (engine.compare) setComparison(engine.compare(input)); else setComparison(null);
  }, [annualSalary, freelanceIncome, otherIncome, retirementContrib, otherDeductions, rentPaid, engine]);

  const handleSave = async () => {
    haptics.medium(); setSaving(true);
    try {
      await taxApi.saveTaxProfile({
        financialYear: engine.financialYear, regime: isIndia ? regime : 'new',
        annualSalary: numVal(annualSalary), freelanceIncome: numVal(freelanceIncome),
        otherIncome: numVal(otherIncome), section80c: numVal(retirementContrib),
        section80d: numVal(otherDeductions), hraReceived: numVal(hraReceived),
        rentPaid: numVal(rentPaid), homeLoanInterest: 0, metroCity: true, gstRegistered: false,
      });
      haptics.success();
      Alert.alert('Saved!', 'Your tax profile has been saved. Tomo AI will use this for personalized tax advice.');
    } catch { Alert.alert('Error', 'Could not save your tax profile.'); }
    finally { setSaving(false); }
  };

  const toggleSection = (s: Section) => { haptics.light(); setExpandedSection((p) => p === s ? 'result' as any : s); };

  const deductionFields = isIndia
    ? [
        { l: 'Section 80C (PPF, ELSS, EPF)', v: retirementContrib, s: setRetirementContrib, p: `Max ${fmt(150000)}` },
        { l: 'Section 80D (Health Insurance)', v: otherDeductions, s: setOtherDeductions, p: `Max ${fmt(25000)}` },
      ]
    : [
        { l: country === 'US' ? '401(k) / IRA Contributions' : country === 'GB' ? 'Pension / SIPP' : country === 'AU' ? 'Superannuation (Concessional)' : 'Retirement / Pension', v: retirementContrib, s: setRetirementContrib, p: '' },
        { l: 'Other Deductions', v: otherDeductions, s: setOtherDeductions, p: '' },
      ];

  if (loading) return (
    <ScreenShell edges={['top']}>
      <View style={styles.loadingWrap}><ActivityIndicator size="large" color={color.forest} /><Text style={styles.loadingText}>Loading tax profile...</Text></View>
    </ScreenShell>
  );

  const grossIncome = estimate?.grossIncome ?? 0;

  return (
    <ScreenShell edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}><Icon name="arrow-left" size={22} color={color.ink} /></TouchableOpacity>
        <View style={{ flex: 1 }}><Text style={styles.headerTitle}>Tax Estimator</Text><Text style={styles.headerSub}>{engine.label}</Text></View>
        <TouchableOpacity onPress={handleSave} disabled={saving} style={styles.saveHeaderBtn}>
          {saving ? <ActivityIndicator size="small" color={color.forest} /> : <Text style={styles.saveHeaderText}>Save</Text>}
        </TouchableOpacity>
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {isIndia && comparison && (
            <AnimatedEntry delay={0}>
              <View style={styles.regimeCard}>
                <Text style={styles.regimeLabel}>Tax Regime</Text>
                <View style={styles.regimeTabs}>
                  {(['new', 'old'] as const).map((r) => (
                    <TouchableOpacity key={r} style={[styles.regimeTab, regime === r && styles.regimeTabActive]} onPress={() => { haptics.light(); setRegime(r); }}>
                      <Text style={[styles.regimeTabText, regime === r && styles.regimeTabTextActive]}>{r === 'new' ? 'New' : 'Old'}</Text>
                      {comparison.recommendedRegime === r && <View style={styles.recommendBadge}><Text style={styles.recommendText}>Best</Text></View>}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </AnimatedEntry>
          )}

          {estimate && (
            <AnimatedEntry delay={60}>
              <View style={styles.resultCard}>
                <View style={styles.resultRow}>
                  <View style={styles.resultCol}><Text style={styles.resultLabel}>Total Tax</Text><Text style={styles.resultAmount}>{fmt(estimate.totalTax)}</Text></View>
                  <View style={styles.resultDivider} />
                  <View style={styles.resultCol}><Text style={styles.resultLabel}>Monthly</Text><Text style={styles.resultAmount}>{fmt(estimate.monthlyTax)}</Text></View>
                  <View style={styles.resultDivider} />
                  <View style={styles.resultCol}><Text style={styles.resultLabel}>Rate</Text><Text style={styles.resultAmount}>{estimate.effectiveTaxRate}%</Text></View>
                </View>
                <View style={styles.breakdownBar}>
                  <View style={[styles.barSegment, { flex: estimate.totalDeductions, backgroundColor: color.forest }]} />
                  <View style={[styles.barSegment, { flex: estimate.totalTax, backgroundColor: color.clay }]} />
                  <View style={[styles.barSegment, { flex: Math.max(grossIncome - estimate.totalDeductions - estimate.totalTax, 0), backgroundColor: color.gold }]} />
                </View>
                <View style={styles.legendRow}>
                  <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: color.forest }]} /><Text style={styles.legendText}>Deductions {fmt(estimate.totalDeductions)}</Text></View>
                  <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: color.clay }]} /><Text style={styles.legendText}>Tax {fmt(estimate.totalTax)}</Text></View>
                  <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: color.gold }]} /><Text style={styles.legendText}>Take Home</Text></View>
                </View>
              </View>
            </AnimatedEntry>
          )}

          {comparison && isIndia && (
            <AnimatedEntry delay={100}>
              <View style={styles.comparisonCard}>
                <Text style={styles.sectionTitle}>Regime Comparison</Text>
                <View style={styles.compareRow}>
                  <View style={styles.compareCol}><Text style={styles.compareLabel}>Old Regime</Text><Text style={[styles.compareAmount, comparison.recommendedRegime === 'old' && styles.compareWinner]}>{fmt(comparison.old.totalTax)}</Text><Text style={styles.compareRate}>{comparison.old.effectiveTaxRate}% rate</Text></View>
                  <View style={styles.vsCircle}><Text style={styles.vsText}>VS</Text></View>
                  <View style={styles.compareCol}><Text style={styles.compareLabel}>New Regime</Text><Text style={[styles.compareAmount, comparison.recommendedRegime === 'new' && styles.compareWinner]}>{fmt(comparison.new.totalTax)}</Text><Text style={styles.compareRate}>{comparison.new.effectiveTaxRate}% rate</Text></View>
                </View>
                {comparison.savings > 0 && (
                  <View style={styles.savingsBanner}><Icon name="trending-down" size={16} color={color.forest} /><Text style={styles.savingsText}>You save {fmt(comparison.savings)}/year with {comparison.recommendedRegime === 'old' ? 'Old' : 'New'} Regime</Text></View>
                )}
              </View>
            </AnimatedEntry>
          )}

          <AnimatedEntry delay={140}>
            <SectionAccordion title="Income Details" icon="💰" expanded={expandedSection === 'income'} onToggle={() => toggleSection('income')}>
              <F label="Annual Salary" value={annualSalary} onChange={setAnnualSalary} placeholder={`e.g. ${fmt(1200000)}`} symbol={loc.symbol} />
              <F label={country === 'US' ? 'Freelance / 1099 Income' : 'Freelance / Self-Employed'} value={freelanceIncome} onChange={setFreelanceIncome} placeholder={`e.g. ${fmt(300000)}`} symbol={loc.symbol} />
              <F label="Other Income (Interest, Rental, etc.)" value={otherIncome} onChange={setOtherIncome} placeholder={`e.g. ${fmt(50000)}`} symbol={loc.symbol} />
            </SectionAccordion>
          </AnimatedEntry>

          <AnimatedEntry delay={180}>
            <SectionAccordion title="Deductions" icon="📋" expanded={expandedSection === 'deductions'} onToggle={() => toggleSection('deductions')}>
              {deductionFields.map((f) => <F key={f.l} label={f.l} value={f.v} onChange={f.s} placeholder={f.p} symbol={loc.symbol} />)}
              {isIndia && (<><F label="HRA Received (Annual)" value={hraReceived} onChange={setHraReceived} placeholder={`e.g. ${fmt(240000)}`} symbol={loc.symbol} /><F label="Rent Paid (Annual)" value={rentPaid} onChange={setRentPaid} placeholder={`e.g. ${fmt(360000)}`} symbol={loc.symbol} /></>)}
            </SectionAccordion>
          </AnimatedEntry>

          <AnimatedEntry delay={300}>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving} activeOpacity={0.8}>
              {saving ? <ActivityIndicator color={color.cream} size="small" /> : <Text style={styles.saveBtnText}>Save Tax Profile</Text>}
            </TouchableOpacity>
            <Text style={styles.disclaimer}>Estimates only. Consult a tax professional for exact calculations. {isIndia && `Based on FY ${engine.financialYear} slabs.`}</Text>
          </AnimatedEntry>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenShell>
  );
}

function SectionAccordion({ title, icon, expanded, onToggle, children }: { title: string; icon: string; expanded: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <View style={styles.accordionCard}>
      <TouchableOpacity style={styles.accordionHeader} onPress={onToggle} activeOpacity={0.7}>
        <Text style={styles.accordionIcon}>{icon}</Text><View style={{ flex: 1 }}><Text style={styles.accordionTitle}>{title}</Text></View>
        <Icon name={expanded ? 'chevron-left' : 'chevron-right'} size={18} color={color.inkFaint} />
      </TouchableOpacity>
      {expanded && <View style={styles.accordionBody}>{children}</View>}
    </View>
  );
}

function F({ label, value, onChange, placeholder, symbol }: { label: string; value: string; onChange: (s: string) => void; placeholder?: string; symbol?: string }) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.inputRow}>
        {symbol ? <Text style={styles.currencyPrefix}>{symbol}</Text> : null}
        <TextInput style={styles.fieldInput} value={value} onChangeText={(t) => onChange(t.replace(/[^0-9]/g, ''))} placeholder={placeholder} placeholderTextColor={color.inkFaint} keyboardType="number-pad" returnKeyType="done" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: color.inkSoft, fontFamily: font.body },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, gap: 12, borderBottomWidth: 1, borderColor: color.line, backgroundColor: color.card },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontFamily: font.bodyBold, color: color.ink },
  headerSub: { fontSize: 12, color: color.inkSoft, marginTop: 2, fontFamily: font.body },
  saveHeaderBtn: { paddingHorizontal: 12, paddingVertical: 6 },
  saveHeaderText: { fontSize: 15, fontFamily: font.bodyBold, color: color.forest },
  scrollContent: { padding: 20, paddingBottom: 60 },
  regimeCard: { backgroundColor: color.card, borderRadius: 16, borderWidth: 1, borderColor: color.line, padding: 16, marginBottom: 16 },
  regimeLabel: { fontSize: 14, fontFamily: font.bodySemi, color: color.inkSoft, marginBottom: 10 },
  regimeTabs: { flexDirection: 'row', gap: 10 },
  regimeTab: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: color.cream2, borderWidth: 1.5, borderColor: 'transparent' },
  regimeTabActive: { borderColor: color.forest },
  regimeTabText: { fontSize: 15, fontFamily: font.bodySemi, color: color.inkFaint },
  regimeTabTextActive: { color: color.forest },
  recommendBadge: { backgroundColor: color.forest, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, marginTop: 6 },
  recommendText: { fontSize: 10, fontFamily: font.displayBold, color: color.cream },
  resultCard: { backgroundColor: color.card, borderRadius: 16, borderWidth: 1, borderColor: color.line, padding: 16, marginBottom: 16 },
  resultRow: { flexDirection: 'row', alignItems: 'center' },
  resultCol: { flex: 1, alignItems: 'center' },
  resultLabel: { fontSize: 11, color: color.inkSoft, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: font.body },
  resultAmount: { fontSize: 18, fontFamily: font.displayBold, color: color.ink },
  resultDivider: { width: 1, height: 36, backgroundColor: color.line },
  breakdownBar: { flexDirection: 'row', height: 8, borderRadius: 4, overflow: 'hidden', marginTop: 16, marginBottom: 10 },
  barSegment: { minWidth: 2 },
  legendRow: { flexDirection: 'row', justifyContent: 'space-between' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: color.inkFaint, fontFamily: font.body },
  comparisonCard: { backgroundColor: color.card, borderRadius: 16, borderWidth: 1, borderColor: color.line, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontFamily: font.bodyBold, color: color.ink, marginBottom: 14 },
  compareRow: { flexDirection: 'row', alignItems: 'center' },
  compareCol: { flex: 1, alignItems: 'center' },
  compareLabel: { fontSize: 13, color: color.inkSoft, marginBottom: 6, fontFamily: font.body },
  compareAmount: { fontSize: 20, fontFamily: font.displayBold, color: color.ink },
  compareWinner: { color: color.forest },
  compareRate: { fontSize: 12, color: color.inkFaint, marginTop: 4, fontFamily: font.body },
  vsCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: color.cream2, alignItems: 'center', justifyContent: 'center', marginHorizontal: 8 },
  vsText: { fontSize: 11, fontFamily: font.displayBold, color: color.inkFaint },
  savingsBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: color.cream2, borderRadius: 10, padding: 12, marginTop: 14 },
  savingsText: { fontSize: 13, fontFamily: font.bodySemi, color: color.forest, flex: 1 },
  accordionCard: { backgroundColor: color.card, borderRadius: 16, borderWidth: 1, borderColor: color.line, marginBottom: 12, overflow: 'hidden' },
  accordionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  accordionIcon: { fontSize: 22 },
  accordionTitle: { fontSize: 15, fontFamily: font.bodySemi, color: color.ink },
  accordionBody: { paddingHorizontal: 16, paddingBottom: 16 },
  fieldWrap: { marginBottom: 14 },
  fieldLabel: { fontSize: 13, color: color.inkSoft, marginBottom: 6, fontFamily: font.body },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: color.cream2, borderRadius: 12, borderWidth: 1, borderColor: color.line },
  currencyPrefix: { fontSize: 16, fontFamily: font.bodySemi, color: color.inkFaint, paddingLeft: 14, paddingRight: 4 },
  fieldInput: { flex: 1, paddingVertical: 12, paddingRight: 14, fontSize: 16, fontFamily: font.bodyMed, color: color.ink },
  saveBtn: { backgroundColor: color.forest, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  saveBtnText: { fontSize: 16, fontFamily: font.bodyBold, color: color.cream },
  disclaimer: { fontSize: 11, color: color.inkFaint, textAlign: 'center', marginTop: 12, lineHeight: 16, fontFamily: font.body },
});
