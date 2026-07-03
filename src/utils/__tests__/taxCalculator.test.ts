import {
  calculateHRAExemption,
  calculateTaxOldRegime,
  calculateTaxNewRegime,
  compareTaxRegimes,
  calculateGST,
  getTaxSummaryText,
} from '../taxCalculator';
import type { TaxProfile } from '../../types';

const baseProfile: TaxProfile = {
  financialYear: '2025-26',
  regime: 'new',
  annualSalary: 0,
  freelanceIncome: 0,
  otherIncome: 0,
  hraReceived: 0,
  rentPaid: 0,
  metroCity: false,
  section80c: 0,
  section80d: 0,
  homeLoanInterest: 0,
  otherDeductions: 0,
  gstRegistered: false,
};

const profile = (overrides: Partial<TaxProfile>): TaxProfile => ({
  ...baseProfile,
  ...overrides,
});

describe('calculateTaxNewRegime', () => {
  it('applies the ₹75k standard deduction on salary', () => {
    const result = calculateTaxNewRegime(profile({ annualSalary: 1000000 }));
    expect(result.totalDeductions).toBe(75000);
    expect(result.taxableIncome).toBe(925000);
  });

  it('caps the standard deduction at the salary amount', () => {
    // Freelance-only income gets no salary standard deduction
    const result = calculateTaxNewRegime(profile({ freelanceIncome: 1000000 }));
    expect(result.totalDeductions).toBe(0);
    expect(result.taxableIncome).toBe(1000000);
  });

  it('charges zero tax at the ₹4L slab boundary', () => {
    // 4,75,000 salary − 75,000 std deduction = 4,00,000 taxable → 0% slab
    const result = calculateTaxNewRegime(profile({ annualSalary: 475000 }));
    expect(result.taxableIncome).toBe(400000);
    expect(result.taxAmount).toBe(0);
    expect(result.totalTax).toBe(0);
  });

  it('rebates all slab tax at ₹8L taxable (Section 87A)', () => {
    // Taxable 8,00,000 → slab tax 4L × 5% = 20,000, wiped by 87A rebate
    const result = calculateTaxNewRegime(profile({ annualSalary: 875000 }));
    expect(result.taxableIncome).toBe(800000);
    expect(result.taxAmount).toBe(0);
    expect(result.totalTax).toBe(0);
  });

  it('rebates all slab tax at exactly ₹12L taxable (rebate limit)', () => {
    // Taxable 12,00,000 → slab tax 20,000 + 40,000 = 60,000 = rebate max
    const result = calculateTaxNewRegime(profile({ annualSalary: 1275000 }));
    expect(result.taxableIncome).toBe(1200000);
    expect(result.taxAmount).toBe(0);
    expect(result.totalTax).toBe(0);
  });

  it('charges full slab tax just past the ₹12L rebate limit', () => {
    // Taxable 12,25,000 → 20,000 + 40,000 + 25,000 × 15% = 63,750; no rebate
    const result = calculateTaxNewRegime(profile({ annualSalary: 1300000 }));
    expect(result.taxableIncome).toBe(1225000);
    expect(result.taxAmount).toBe(63750);
    expect(result.cess).toBe(2550);
    expect(result.totalTax).toBe(66300);
  });

  it('computes slab tax at the ₹16L boundary', () => {
    // Taxable 16,00,000 → 20,000 + 40,000 + 60,000 = 1,20,000
    const result = calculateTaxNewRegime(profile({ annualSalary: 1675000 }));
    expect(result.taxableIncome).toBe(1600000);
    expect(result.taxAmount).toBe(120000);
    expect(result.totalTax).toBe(124800);
  });

  it('applies the 30% top slab above ₹24L taxable', () => {
    // Taxable 30,00,000 → 3,00,000 (up to 24L) + 6,00,000 × 30% = 4,80,000
    const result = calculateTaxNewRegime(profile({ annualSalary: 3075000 }));
    expect(result.taxableIncome).toBe(3000000);
    expect(result.taxAmount).toBe(480000);
    expect(result.totalTax).toBe(499200);
  });

  it('ignores 80C/80D/HRA inputs entirely', () => {
    const result = calculateTaxNewRegime(
      profile({
        annualSalary: 2000000,
        section80c: 150000,
        section80d: 25000,
        hraReceived: 300000,
        rentPaid: 400000,
      })
    );
    expect(result.totalDeductions).toBe(75000);
    expect(result.hraExemption).toBe(0);
  });

  it('reports monthly tax and effective rate', () => {
    // Total tax 1,24,800 on gross 16,75,000 → 10,400/month, 7.45% effective
    const result = calculateTaxNewRegime(profile({ annualSalary: 1675000 }));
    expect(result.monthlyTax).toBe(10400);
    expect(result.effectiveTaxRate).toBe(7.45);
  });

  it('returns all zeros for zero income', () => {
    const result = calculateTaxNewRegime(profile({}));
    expect(result.grossIncome).toBe(0);
    expect(result.totalTax).toBe(0);
    expect(result.effectiveTaxRate).toBe(0);
  });
});

describe('calculateTaxOldRegime', () => {
  it('applies the ₹50k standard deduction on salary', () => {
    const result = calculateTaxOldRegime(profile({ annualSalary: 1000000 }));
    expect(result.totalDeductions).toBe(50000);
    expect(result.taxableIncome).toBe(950000);
  });

  it('caps the standard deduction at the salary amount', () => {
    const result = calculateTaxOldRegime(profile({ freelanceIncome: 800000 }));
    expect(result.totalDeductions).toBe(0);
    expect(result.taxableIncome).toBe(800000);
  });

  it('charges zero tax at the ₹2.5L slab boundary', () => {
    // 3,00,000 salary − 50,000 std deduction = 2,50,000 taxable → 0% slab
    const result = calculateTaxOldRegime(profile({ annualSalary: 300000 }));
    expect(result.taxableIncome).toBe(250000);
    expect(result.totalTax).toBe(0);
  });

  it('rebates all slab tax at ₹5L taxable (Section 87A)', () => {
    // Taxable 5,00,000 → slab tax 2.5L × 5% = 12,500 = rebate max
    const result = calculateTaxOldRegime(profile({ annualSalary: 550000 }));
    expect(result.taxableIncome).toBe(500000);
    expect(result.taxAmount).toBe(0);
    expect(result.totalTax).toBe(0);
  });

  it('charges full slab tax past the ₹5L rebate limit', () => {
    // Taxable 5,50,000 → 12,500 + 50,000 × 20% = 22,500; no rebate
    const result = calculateTaxOldRegime(profile({ annualSalary: 600000 }));
    expect(result.taxableIncome).toBe(550000);
    expect(result.taxAmount).toBe(22500);
    expect(result.totalTax).toBe(23400);
  });

  it('computes slab tax at the ₹10L boundary with 4% cess', () => {
    // Taxable 10,00,000 → 12,500 + 5L × 20% = 1,12,500; cess = 4,500
    const result = calculateTaxOldRegime(profile({ annualSalary: 1050000 }));
    expect(result.taxableIncome).toBe(1000000);
    expect(result.taxAmount).toBe(112500);
    expect(result.cess).toBe(4500);
    expect(result.totalTax).toBe(117000);
  });

  it('applies the 30% top slab above ₹10L taxable', () => {
    // Taxable 15,00,000 → 1,12,500 + 5,00,000 × 30% = 2,62,500
    const result = calculateTaxOldRegime(profile({ annualSalary: 1550000 }));
    expect(result.taxableIncome).toBe(1500000);
    expect(result.taxAmount).toBe(262500);
    expect(result.totalTax).toBe(273000);
  });

  it('caps Section 80C at ₹1.5L', () => {
    const result = calculateTaxOldRegime(
      profile({ annualSalary: 1200000, section80c: 250000 })
    );
    // 50,000 std + 1,50,000 capped 80C
    expect(result.totalDeductions).toBe(200000);
    expect(result.taxableIncome).toBe(1000000);
  });

  it('caps Section 80D at ₹25k', () => {
    const result = calculateTaxOldRegime(
      profile({ annualSalary: 1200000, section80d: 40000 })
    );
    expect(result.totalDeductions).toBe(75000); // 50,000 std + 25,000 capped 80D
  });

  it('caps home loan interest at ₹2L', () => {
    const result = calculateTaxOldRegime(
      profile({ annualSalary: 1200000, homeLoanInterest: 300000 })
    );
    expect(result.totalDeductions).toBe(250000); // 50,000 std + 2,00,000 capped
  });

  it('includes the HRA exemption in deductions and the estimate', () => {
    // HRA: min(2,40,000, 2,00,000 − 60,000, 50% × 6,00,000) = 1,40,000
    const result = calculateTaxOldRegime(
      profile({
        annualSalary: 600000,
        hraReceived: 240000,
        rentPaid: 200000,
        metroCity: true,
      })
    );
    expect(result.hraExemption).toBe(140000);
    expect(result.totalDeductions).toBe(190000); // 50,000 std + 1,40,000 HRA
  });

  it('returns all zeros for zero income', () => {
    const result = calculateTaxOldRegime(profile({}));
    expect(result.grossIncome).toBe(0);
    expect(result.totalTax).toBe(0);
    expect(result.effectiveTaxRate).toBe(0);
  });

  it('never produces negative taxable income', () => {
    const result = calculateTaxOldRegime(
      profile({ annualSalary: 100000, section80c: 150000 })
    );
    expect(result.taxableIncome).toBe(0);
    expect(result.totalTax).toBe(0);
  });
});

describe('calculateHRAExemption', () => {
  it('returns the lowest of the three exemption options', () => {
    // min(hra 2,40,000, rent − 10% basic = 1,40,000, 50% basic = 3,00,000)
    expect(calculateHRAExemption(600000, 240000, 200000, true)).toBe(140000);
  });

  it('picks HRA received when it is the lowest', () => {
    // min(3,00,000, 6,00,000 − 1,00,000, 5,00,000) = 3,00,000
    expect(calculateHRAExemption(1000000, 300000, 600000, true)).toBe(300000);
  });

  it('uses 50% of basic for metro and 40% for non-metro', () => {
    // Options: hra 6,00,000, rent − 10% = 7,00,000, percent-of-basic
    expect(calculateHRAExemption(1000000, 600000, 800000, true)).toBe(500000);
    expect(calculateHRAExemption(1000000, 600000, 800000, false)).toBe(400000);
  });

  it('clamps to zero when rent is below 10% of basic', () => {
    // rent − 10% basic = 50,000 − 1,20,000 = negative
    expect(calculateHRAExemption(1200000, 100000, 50000, true)).toBe(0);
  });

  it('returns zero when any input is missing', () => {
    expect(calculateHRAExemption(0, 240000, 200000, true)).toBe(0);
    expect(calculateHRAExemption(600000, 0, 200000, true)).toBe(0);
    expect(calculateHRAExemption(600000, 240000, 0, true)).toBe(0);
  });
});

describe('surcharge', () => {
  it('charges no surcharge at exactly ₹50L taxable', () => {
    // Taxable 50,00,000 → slab tax 3,00,000 + 26L × 30% = 10,80,000
    const result = calculateTaxNewRegime(profile({ annualSalary: 5075000 }));
    expect(result.taxableIncome).toBe(5000000);
    expect(result.taxAmount).toBe(1080000);
    expect(result.totalTax).toBe(1123200);
  });

  it('adds 10% surcharge between ₹50L and ₹1Cr', () => {
    // Taxable 60,00,000 → base 13,80,000 + 10% surcharge = 15,18,000
    const result = calculateTaxNewRegime(profile({ annualSalary: 6075000 }));
    expect(result.taxableIncome).toBe(6000000);
    expect(result.taxAmount).toBe(1518000);
    expect(result.cess).toBe(60720);
    expect(result.totalTax).toBe(1578720);
  });

  it('adds 15% surcharge between ₹1Cr and ₹2Cr', () => {
    // Taxable 1,20,00,000 → base 31,80,000 + 15% surcharge = 36,57,000
    const result = calculateTaxNewRegime(profile({ annualSalary: 12075000 }));
    expect(result.taxAmount).toBe(3657000);
  });

  it('adds 25% surcharge between ₹2Cr and ₹5Cr', () => {
    // Taxable 3,00,00,000 → base 85,80,000 + 25% surcharge = 1,07,25,000
    const result = calculateTaxNewRegime(profile({ annualSalary: 30075000 }));
    expect(result.taxAmount).toBe(10725000);
  });

  it('adds 37% surcharge above ₹5Cr', () => {
    // Taxable 6,00,00,000 → base 1,75,80,000 + 37% surcharge = 2,40,84,600
    const result = calculateTaxNewRegime(profile({ annualSalary: 60075000 }));
    expect(result.taxAmount).toBe(24084600);
  });
});

describe('compareTaxRegimes', () => {
  it('matches the individual regime calculations', () => {
    const p = profile({ annualSalary: 1500000, section80c: 150000 });
    const comparison = compareTaxRegimes(p);
    expect(comparison.old).toEqual(calculateTaxOldRegime(p));
    expect(comparison.new).toEqual(calculateTaxNewRegime(p));
  });

  it('recommends the new regime for high income with no deductions', () => {
    // Old: taxable 29,50,000 → 7,25,400 total; New: taxable 29,25,000 → 4,75,800
    const comparison = compareTaxRegimes(profile({ annualSalary: 3000000 }));
    expect(comparison.recommendedRegime).toBe('new');
    expect(comparison.savings).toBe(249600);
  });

  it('recommends the old regime on a tie', () => {
    // Both regimes rebate down to zero tax at this income
    const comparison = compareTaxRegimes(profile({ annualSalary: 475000 }));
    expect(comparison.old.totalTax).toBe(comparison.new.totalTax);
    expect(comparison.recommendedRegime).toBe('old');
    expect(comparison.savings).toBe(0);
  });
});

describe('calculateGST', () => {
  it('owes nothing when unregistered and below the ₹20L threshold', () => {
    expect(calculateGST(1000000, false)).toEqual({
      gstLiability: 0,
      threshold: false,
      rate: 0,
    });
  });

  it('owes nothing when unregistered at exactly ₹20L', () => {
    expect(calculateGST(2000000, false).gstLiability).toBe(0);
  });

  it('charges 18% when unregistered above the threshold', () => {
    expect(calculateGST(2500000, false)).toEqual({
      gstLiability: 450000,
      threshold: true,
      rate: 0.18,
    });
  });

  it('charges 18% when registered even below the threshold', () => {
    expect(calculateGST(1000000, true)).toEqual({
      gstLiability: 180000,
      threshold: false,
      rate: 0.18,
    });
  });
});

describe('getTaxSummaryText', () => {
  it('names the winning regime and the savings', () => {
    const comparison = compareTaxRegimes(profile({ annualSalary: 3000000 }));
    const text = getTaxSummaryText(comparison);
    expect(text).toContain('New Regime');
    expect(text).toContain(`₹${(249600).toLocaleString('en-IN')}`);
  });

  it('explains a tie', () => {
    const comparison = compareTaxRegimes(profile({ annualSalary: 475000 }));
    expect(getTaxSummaryText(comparison)).toBe(
      'Both regimes result in the same tax. The New Regime is simpler.'
    );
  });
});
