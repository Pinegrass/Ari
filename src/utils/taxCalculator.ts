/**
 * Multi-country Tax Calculator
 *
 * Supported countries: IN, US, GB, AU (plus GLOBAL generic fallback).
 * Each engine is a pure function — no API calls, instant calculations.
 *
 * Architecture:
 *   getTaxEngine(country) → TaxEngine
 *   engine.calculate(input) → TaxEstimate
 *
 * All amounts in the country's whole currency unit (rupees / dollars / pounds).
 */

import type { TaxEstimate, TaxComparison } from '../types';

// ─── Shared types ───────────────────────────────────────────────────────────

export interface TaxSlab {
  from: number;
  to: number;
  rate: number;
}

export interface TaxEngineInput {
  /** Annual salary / wage income in local currency */
  annualSalary: number;
  /** Freelance / self-employed / 1099 income */
  freelanceIncome: number;
  /** Other income (interest, rental, dividends) */
  otherIncome: number;
  /** Tax-deductible retirement/pension contributions (80C, 401k, SIPP, super) */
  retirementContributions: number;
  /** Other deductions (80D health, NPS, etc.) */
  otherDeductions: number;
  /** Home loan / mortgage interest (India: capped at ₹2L under old regime) */
  homeLoanInterest?: number;
  /** Housing: rent paid annually */
  rentPaid: number;
  /** For UK: are you in Scotland? */
  scotlandResident?: boolean;
}

export interface TaxEngine {
  country: string;
  label: string;
  financialYear: string;
  calculate(input: TaxEngineInput): TaxEstimate;
  /** Optional comparison between regimes (IN only has old vs new) */
  compare?: (input: TaxEngineInput) => TaxComparison | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function calcSlabTax(income: number, slabs: TaxSlab[]): number {
  let tax = 0;
  for (const slab of slabs) {
    if (income <= slab.from) break;
    tax += (Math.min(income, slab.to) - slab.from) * slab.rate;
  }
  return Math.round(tax);
}

function effectiveRate(totalTax: number, gross: number): number {
  return gross > 0 ? Math.round((totalTax / gross) * 10000) / 100 : 0;
}

// ─── India Tax Engine (FY 2026-27 / AY 2027-28) ────────────────────────────

const IN_SLABS_NEW: TaxSlab[] = [
  { from: 0, to: 400_000, rate: 0 },
  { from: 400_000, to: 800_000, rate: 0.05 },
  { from: 800_000, to: 1_200_000, rate: 0.10 },
  { from: 1_200_000, to: 1_600_000, rate: 0.15 },
  { from: 1_600_000, to: 2_000_000, rate: 0.20 },
  { from: 2_000_000, to: 2_400_000, rate: 0.25 },
  { from: 2_400_000, to: Infinity, rate: 0.30 },
];

const IN_SLABS_OLD: TaxSlab[] = [
  { from: 0, to: 250_000, rate: 0 },
  { from: 250_000, to: 500_000, rate: 0.05 },
  { from: 500_000, to: 1_000_000, rate: 0.20 },
  { from: 1_000_000, to: Infinity, rate: 0.30 },
];

const IN_STANDARD_DEDUCTION_NEW = 75_000;
const IN_STANDARD_DEDUCTION_OLD = 50_000;
const IN_CESS_RATE = 0.04;
const IN_REBATE_LIMIT_NEW = 1_200_000;
const IN_REBATE_LIMIT_OLD = 500_000;
const IN_REBATE_MAX_NEW = 60_000;
const IN_REBATE_MAX_OLD = 12_500;

function inSurcharge(tax: number, taxableIncome: number): number {
  if (taxableIncome <= 5_000_000) return 0;
  if (taxableIncome <= 10_000_000) return Math.round(tax * 0.10);
  if (taxableIncome <= 20_000_000) return Math.round(tax * 0.15);
  if (taxableIncome <= 50_000_000) return Math.round(tax * 0.25);
  return Math.round(tax * 0.37);
}

function calcIndiaNew(input: TaxEngineInput): TaxEstimate {
  const gross = input.annualSalary + input.freelanceIncome + input.otherIncome;
  const stdDed = Math.min(IN_STANDARD_DEDUCTION_NEW, input.annualSalary);
  const taxable = Math.max(0, gross - stdDed);
  let tax = calcSlabTax(taxable, IN_SLABS_NEW);
  if (taxable <= IN_REBATE_LIMIT_NEW) tax = Math.max(0, tax - IN_REBATE_MAX_NEW);
  tax += inSurcharge(tax, taxable);
  const cess = Math.round(tax * IN_CESS_RATE);
  const total = tax + cess;
  return {
    grossIncome: gross,
    totalDeductions: stdDed,
    taxableIncome: taxable,
    taxAmount: tax,
    cess,
    totalTax: total,
    monthlyTax: Math.round(total / 12),
    effectiveTaxRate: effectiveRate(total, gross),
    hraExemption: 0,
  };
}

function calcIndiaOld(input: TaxEngineInput): TaxEstimate {
  const gross = input.annualSalary + input.freelanceIncome + input.otherIncome;
  const stdDed = Math.min(IN_STANDARD_DEDUCTION_OLD, input.annualSalary);
  const rentDed = input.rentPaid
    ? Math.max(0, Math.round(
        Math.min(input.annualSalary * 0.40, input.rentPaid - 0.10 * input.annualSalary)
      ))
    : 0;
  const totalDed = stdDed + Math.min(input.retirementContributions, 150_000) +
    Math.min(input.otherDeductions, 25_000) +
    Math.min(input.homeLoanInterest ?? 0, 200_000) +
    rentDed;
  const taxable = Math.max(0, gross - totalDed);
  let tax = calcSlabTax(taxable, IN_SLABS_OLD);
  if (taxable <= IN_REBATE_LIMIT_OLD) tax = Math.max(0, tax - IN_REBATE_MAX_OLD);
  tax += inSurcharge(tax, taxable);
  const cess = Math.round(tax * IN_CESS_RATE);
  const total = tax + cess;
  return {
    grossIncome: gross,
    totalDeductions: totalDed,
    taxableIncome: taxable,
    taxAmount: tax,
    cess,
    totalTax: total,
    monthlyTax: Math.round(total / 12),
    effectiveTaxRate: effectiveRate(total, gross),
    hraExemption: rentDed,
  };
}

const indiaEngine: TaxEngine = {
  country: 'IN',
  label: 'India — FY 2026-27',
  financialYear: '2026-27',
  calculate(input) { return calcIndiaNew(input); },
  compare(input) {
    const old = calcIndiaOld(input);
    const nw = calcIndiaNew(input);
    return {
      old, new: nw,
      recommendedRegime: old.totalTax <= nw.totalTax ? 'old' : 'new',
      savings: Math.abs(old.totalTax - nw.totalTax),
    };
  },
};

// ─── US Tax Engine (2025 tax year, filed 2026) ─────────────────────────────

const US_SLABS_SINGLE: TaxSlab[] = [
  { from: 0, to: 11_925, rate: 0.10 },
  { from: 11_925, to: 48_475, rate: 0.12 },
  { from: 48_475, to: 103_350, rate: 0.22 },
  { from: 103_350, to: 197_300, rate: 0.24 },
  { from: 197_300, to: 250_525, rate: 0.32 },
  { from: 250_525, to: 626_350, rate: 0.35 },
  { from: 626_350, to: Infinity, rate: 0.37 },
];

const US_STANDARD_DEDUCTION = 15_000; // 2025 single filer
const US_FICA_RATE = 0.0765; // 6.2% SS + 1.45% Medicare (employee portion)

function calcUS(input: TaxEngineInput): TaxEstimate {
  const gross = input.annualSalary + input.freelanceIncome + input.otherIncome;
  // 401(k) / IRA contributions reduce taxable income
  const retireDed = Math.min(input.retirementContributions, 23_500); // 2025 401(k) limit
  const taxable = Math.max(0, gross - US_STANDARD_DEDUCTION - retireDed);
  const incomeTax = calcSlabTax(taxable, US_SLABS_SINGLE);
  // FICA on salary only (not investment income)
  const fica = Math.round(
    (input.annualSalary + input.freelanceIncome) * US_FICA_RATE
  );
  const total = incomeTax + fica;
  return {
    grossIncome: gross,
    totalDeductions: US_STANDARD_DEDUCTION + retireDed,
    taxableIncome: taxable,
    taxAmount: incomeTax,
    cess: fica, // reusing cess field for FICA/payroll tax
    totalTax: total,
    monthlyTax: Math.round(total / 12),
    effectiveTaxRate: effectiveRate(total, gross),
    hraExemption: 0,
  };
}

const usEngine: TaxEngine = {
  country: 'US',
  label: 'US — 2025 Tax Year',
  financialYear: '2025',
  calculate: calcUS,
};

// ─── UK Tax Engine (2026-27) ────────────────────────────────────────────────

const UK_SLABS: TaxSlab[] = [
  { from: 0, to: 12_570, rate: 0 },
  { from: 12_570, to: 50_270, rate: 0.20 },
  { from: 50_270, to: 125_140, rate: 0.40 },
  { from: 125_140, to: Infinity, rate: 0.45 },
];

const UK_NI_LOWER = 12_570; // Primary threshold (aligned with PA)
const UK_NI_UPPER = 50_270; // Upper earnings limit
const UK_NI_MAIN_RATE = 0.08; // Class 1 employee rate
const UK_NI_UPPER_RATE = 0.02;

function calcUK(input: TaxEngineInput): TaxEstimate {
  const gross = input.annualSalary + input.freelanceIncome + input.otherIncome;
  const pensionDed = Math.min(input.retirementContributions, 60_000); // annual allowance
  const giftAid = Math.min(input.otherDeductions, gross * 0.25); // rough
  const taxable = Math.max(0, gross - pensionDed - giftAid);

  // Income Tax
  const incomeTax = calcSlabTax(taxable, UK_SLABS);
  // National Insurance (on salary + freelance, not investment)
  const niEarnings = Math.max(0, input.annualSalary + input.freelanceIncome - UK_NI_LOWER);
  let ni = 0;
  if (niEarnings > 0) {
    const mainBand = Math.min(niEarnings, UK_NI_UPPER - UK_NI_LOWER);
    ni += Math.round(mainBand * UK_NI_MAIN_RATE);
    if (niEarnings > UK_NI_UPPER - UK_NI_LOWER) {
      ni += Math.round((niEarnings - (UK_NI_UPPER - UK_NI_LOWER)) * UK_NI_UPPER_RATE);
    }
  }
  const total = incomeTax + ni;
  return {
    grossIncome: gross,
    totalDeductions: pensionDed + giftAid,
    taxableIncome: taxable,
    taxAmount: incomeTax,
    cess: ni, // NI stored in cess field
    totalTax: total,
    monthlyTax: Math.round(total / 12),
    effectiveTaxRate: effectiveRate(total, gross),
    hraExemption: 0,
  };
}

const ukEngine: TaxEngine = {
  country: 'GB',
  label: 'UK — 2026-27',
  financialYear: '2026-27',
  calculate: calcUK,
};

// ─── Australia Tax Engine (2025-26, Stage 3 cuts) ───────────────────────────

const AU_SLABS: TaxSlab[] = [
  { from: 0, to: 18_200, rate: 0 },
  { from: 18_200, to: 45_000, rate: 0.16 },
  { from: 45_000, to: 135_000, rate: 0.30 },
  { from: 135_000, to: 190_000, rate: 0.37 },
  { from: 190_000, to: Infinity, rate: 0.45 },
];

const AU_MEDICARE_RATE = 0.02;

function calcAU(input: TaxEngineInput): TaxEstimate {
  const gross = input.annualSalary + input.freelanceIncome + input.otherIncome;
  const superDed = Math.min(input.retirementContributions, 30_000); // concessional cap
  const taxable = Math.max(0, gross - superDed);
  const incomeTax = calcSlabTax(taxable, AU_SLABS);
  // Medicare Levy (on taxable income, with low-income threshold ~$24k simplified)
  const medicare = taxable > 24_276 ? Math.round(taxable * AU_MEDICARE_RATE) : 0;
  const total = incomeTax + medicare;
  return {
    grossIncome: gross,
    totalDeductions: superDed,
    taxableIncome: taxable,
    taxAmount: incomeTax,
    cess: medicare,
    totalTax: total,
    monthlyTax: Math.round(total / 12),
    effectiveTaxRate: effectiveRate(total, gross),
    hraExemption: 0,
  };
}

const auEngine: TaxEngine = {
  country: 'AU',
  label: 'Australia — 2025-26',
  financialYear: '2025-26',
  calculate: calcAU,
};

// ─── Generic / Global fallback (simple progressive) ─────────────────────────

const GLOBAL_SLABS: TaxSlab[] = [
  { from: 0, to: 12_000, rate: 0 },
  { from: 12_000, to: 50_000, rate: 0.15 },
  { from: 50_000, to: 150_000, rate: 0.25 },
  { from: 150_000, to: Infinity, rate: 0.35 },
];

function calcGlobal(input: TaxEngineInput): TaxEstimate {
  const gross = input.annualSalary + input.freelanceIncome + input.otherIncome;
  const taxable = Math.max(0, gross - input.retirementContributions - input.otherDeductions);
  const tax = calcSlabTax(taxable, GLOBAL_SLABS);
  return {
    grossIncome: gross,
    totalDeductions: input.retirementContributions + input.otherDeductions,
    taxableIncome: taxable,
    taxAmount: tax,
    cess: 0,
    totalTax: tax,
    monthlyTax: Math.round(tax / 12),
    effectiveTaxRate: effectiveRate(tax, gross),
    hraExemption: 0,
  };
}

const globalEngine: TaxEngine = {
  country: 'GLOBAL',
  label: 'Generic — Progressive',
  financialYear: '2026',
  calculate: calcGlobal,
};

// ─── Engine registry ────────────────────────────────────────────────────────

const ENGINES: Record<string, TaxEngine> = {
  IN: indiaEngine,
  US: usEngine,
  GB: ukEngine,
  AU: auEngine,
};

export function getTaxEngine(country: string | null | undefined): TaxEngine {
  const code = (country || '').toUpperCase();
  return ENGINES[code] ?? globalEngine;
}

export function getSupportedTaxCountries(): string[] {
  return Object.keys(ENGINES);
}

/** Quick check: does this country have a dedicated tax engine (vs generic)? */
export function hasDedicatedTaxEngine(country: string | null | undefined): boolean {
  const code = (country || '').toUpperCase();
  return code in ENGINES;
}

// ─── Backward-compat exports (existing callers) ─────────────────────────────

export { indiaEngine as indiaTaxEngine };

/** Map old TaxProfile shape → TaxEngineInput shape */
function _mapLegacyProfile(p: any): TaxEngineInput {
  return {
    annualSalary: p.annualSalary ?? 0,
    freelanceIncome: p.freelanceIncome ?? 0,
    otherIncome: p.otherIncome ?? 0,
    retirementContributions: p.section80c ?? 0,
    otherDeductions: (p.section80d ?? 0) + (p.otherDeductions ?? 0),
    homeLoanInterest: p.homeLoanInterest ?? 0,
    rentPaid: p.rentPaid ?? 0,
  };
}

/** @deprecated Use getTaxEngine('IN').compare() instead */
export function compareTaxRegimes(input: any): TaxComparison {
  const c = indiaEngine.compare!(_mapLegacyProfile(input));
  return c!;
}

/** @deprecated Use getTaxEngine('IN').calculate() instead */
export function calculateTaxOldRegime(input: any): TaxEstimate {
  return calcIndiaOld(_mapLegacyProfile(input));
}

/** @deprecated Use getTaxEngine('IN').calculate() instead */
export function calculateTaxNewRegime(input: any): TaxEstimate {
  return calcIndiaNew(_mapLegacyProfile(input));
}

export function calculateHRAExemption(
  basicSalary: number,
  hraReceived: number,
  rentPaid: number,
  isMetro: boolean
): number {
  if (!hraReceived || !rentPaid || !basicSalary) return 0;
  const pct = isMetro ? 0.50 : 0.40;
  return Math.max(0, Math.round(Math.min(hraReceived, rentPaid - 0.10 * basicSalary, pct * basicSalary)));
}

export function calculateGST(
  freelanceIncome: number,
  isRegistered: boolean
): { gstLiability: number; threshold: boolean; rate: number } {
  const THRESHOLD = 2_000_000;
  if (!isRegistered && freelanceIncome <= THRESHOLD) {
    return { gstLiability: 0, threshold: false, rate: 0 };
  }
  return { gstLiability: Math.round(freelanceIncome * 0.18), threshold: freelanceIncome > THRESHOLD, rate: 0.18 };
}

export function getTaxSummaryText(
  comparison: TaxComparison,
  locale?: { symbol?: string } | string | null
): string {
  // Backward compat: no locale → default to ₹ with Indian numbering
  const symbol = typeof locale === 'string'
    ? '$'
    : locale?.symbol ?? '₹';
  const { recommendedRegime, savings } = comparison;
  const label = recommendedRegime === 'old' ? 'Old' : 'New';
  if (savings === 0) return 'Both regimes result in the same tax. The New Regime is simpler.';
  return `The ${label} Regime saves you ${symbol}${savings.toLocaleString('en-IN')} per year.`;
}
