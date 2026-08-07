import { effectiveProgress, hasRollover } from '../budgetRollover';

describe('effectiveProgress', () => {
  it('matches raw-limit behaviour when no rollover applies', () => {
    // available == limit: identical to spent/limit math
    expect(effectiveProgress(500, 1000)).toEqual({
      percentage: 50,
      remaining: 500,
      isOver: false,
    });
  });

  it('uses the rollover-inflated available for underspend carry', () => {
    const p = effectiveProgress(900, 1500);
    expect(p.percentage).toBe(60);
    expect(p.remaining).toBe(600);
    expect(p.isOver).toBe(false);
  });

  it('uses the rollover-reduced available for overspend carry', () => {
    const p = effectiveProgress(600, 700);
    expect(p.percentage).toBe(86);
    expect(p.remaining).toBe(100);
    expect(p.isOver).toBe(false);
  });

  it('flags over-budget when spend exceeds available', () => {
    const p = effectiveProgress(800, 700);
    expect(p.percentage).toBe(114);
    expect(p.remaining).toBe(-100);
    expect(p.isOver).toBe(true);
  });

  it('handles available <= 0 (rollover debt exceeds the limit)', () => {
    const p = effectiveProgress(50, -200);
    expect(p.percentage).toBe(100);
    expect(p.remaining).toBe(-250);
    expect(p.isOver).toBe(true);
  });

  it('handles zero available with zero spend', () => {
    const p = effectiveProgress(0, 0);
    expect(p.percentage).toBe(0);
    expect(p.remaining).toBe(0);
    expect(p.isOver).toBe(false);
  });

  it('handles zero spend with positive available', () => {
    expect(effectiveProgress(0, 1000)).toEqual({
      percentage: 0,
      remaining: 1000,
      isOver: false,
    });
  });
});

describe('hasRollover', () => {
  it('is true for non-zero carries in either direction', () => {
    expect(hasRollover(800)).toBe(true);
    expect(hasRollover(-200)).toBe(true);
  });

  it('is false for zero / missing rollover', () => {
    expect(hasRollover(0)).toBe(false);
    expect(hasRollover(null)).toBe(false);
    expect(hasRollover(undefined)).toBe(false);
  });
});
