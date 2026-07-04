import {
  IST_OFFSET_MIN,
  daysInMonth,
  clampDayToMonth,
  toISODate,
  istToday,
  istInstant,
  addDays,
  nextMonthlyOccurrence,
  remindersForOccurrence,
  upcomingReminders,
} from '../billSchedule';

// Helper: an absolute instant for a given IST wall time, built independently of
// the module under test (so the test isn't circular). IST = UTC+5:30.
function istWall(y: number, m: number, d: number, h = 0, min = 0): Date {
  return new Date(Date.UTC(y, m - 1, d, h, min) - IST_OFFSET_MIN * 60 * 1000);
}

describe('daysInMonth', () => {
  it('handles 31/30 day months', () => {
    expect(daysInMonth(2026, 1)).toBe(31); // Jan
    expect(daysInMonth(2026, 4)).toBe(30); // Apr
    expect(daysInMonth(2026, 12)).toBe(31); // Dec
  });

  it('handles February in common and leap years', () => {
    expect(daysInMonth(2026, 2)).toBe(28); // 2026 not a leap year
    expect(daysInMonth(2028, 2)).toBe(29); // 2028 is a leap year
    expect(daysInMonth(2000, 2)).toBe(29); // century leap year
    expect(daysInMonth(1900, 2)).toBe(28); // century non-leap year
  });
});

describe('clampDayToMonth', () => {
  it('clamps a due day past the end of the month', () => {
    expect(clampDayToMonth(2026, 2, 31)).toBe(28); // Feb non-leap
    expect(clampDayToMonth(2028, 2, 31)).toBe(29); // Feb leap
    expect(clampDayToMonth(2026, 4, 31)).toBe(30); // April
    expect(clampDayToMonth(2026, 1, 31)).toBe(31); // January — unchanged
  });

  it('leaves in-range days untouched', () => {
    expect(clampDayToMonth(2026, 2, 15)).toBe(15);
    expect(clampDayToMonth(2026, 6, 1)).toBe(1);
  });
});

describe('istToday / IST anchoring', () => {
  it('reads the IST calendar date, not the UTC date, near midnight', () => {
    // 2026-07-14 22:00 UTC === 2026-07-15 03:30 IST — the IST *date* is the 15th.
    const now = new Date('2026-07-14T22:00:00Z');
    expect(istToday(now)).toEqual({ year: 2026, month: 7, day: 15 });
  });

  it('stays on the same IST day just after IST midnight', () => {
    // 2026-07-14 18:30 UTC === 2026-07-15 00:00 IST.
    const now = new Date('2026-07-14T18:30:00Z');
    expect(istToday(now)).toEqual({ year: 2026, month: 7, day: 15 });
  });
});

describe('istInstant', () => {
  it('maps 9:00 AM IST to 03:30 UTC on the same date', () => {
    const inst = istInstant({ year: 2026, month: 7, day: 15 }, 9, 0);
    expect(inst.toISOString()).toBe('2026-07-15T03:30:00.000Z');
  });

  it('maps IST midnight to 18:30 UTC the previous day', () => {
    const inst = istInstant({ year: 2026, month: 7, day: 15 }, 0, 0);
    expect(inst.toISOString()).toBe('2026-07-14T18:30:00.000Z');
  });
});

describe('addDays (calendar, IST)', () => {
  it('steps back across a month boundary', () => {
    expect(addDays({ year: 2026, month: 8, day: 1 }, -1)).toEqual({ year: 2026, month: 7, day: 31 });
  });

  it('steps back across a year boundary', () => {
    expect(addDays({ year: 2026, month: 1, day: 1 }, -1)).toEqual({ year: 2025, month: 12, day: 31 });
  });

  it('steps back into leap-day February', () => {
    expect(addDays({ year: 2028, month: 3, day: 1 }, -1)).toEqual({ year: 2028, month: 2, day: 29 });
  });
});

describe('nextMonthlyOccurrence', () => {
  it('returns this month when the due day is still ahead', () => {
    const now = istWall(2026, 7, 10, 12, 0); // 10 Jul, noon IST
    expect(nextMonthlyOccurrence(15, now)).toEqual({ year: 2026, month: 7, day: 15 });
  });

  it('returns today when the due day is today', () => {
    const now = istWall(2026, 7, 15, 6, 0); // 15 Jul early morning
    expect(nextMonthlyOccurrence(15, now)).toEqual({ year: 2026, month: 7, day: 15 });
  });

  it('rolls to next month when the due day has passed', () => {
    const now = istWall(2026, 7, 20, 12, 0); // 20 Jul
    expect(nextMonthlyOccurrence(15, now)).toEqual({ year: 2026, month: 8, day: 15 });
  });

  it('clamps a 31st due day to a short month (Feb non-leap)', () => {
    const now = istWall(2026, 2, 1, 12, 0);
    expect(nextMonthlyOccurrence(31, now)).toEqual({ year: 2026, month: 2, day: 28 });
  });

  it('clamps a 31st due day to a leap February', () => {
    const now = istWall(2028, 2, 1, 12, 0);
    expect(nextMonthlyOccurrence(31, now)).toEqual({ year: 2028, month: 2, day: 29 });
  });

  it('rolls Dec → Jan of the next year', () => {
    const now = istWall(2026, 12, 20, 12, 0);
    expect(nextMonthlyOccurrence(5, now)).toEqual({ year: 2027, month: 1, day: 5 });
  });
});

describe('remindersForOccurrence', () => {
  it('produces a day-before and day-of reminder at 9:00 IST', () => {
    const occ = { year: 2026, month: 7, day: 15 };
    const now = istWall(2026, 7, 1, 0, 0); // well before both
    const r = remindersForOccurrence(occ, now, 9, 0);
    expect(r.map((x) => x.kind)).toEqual(['day_before', 'day_of']);
    expect(r[0].fireAt.toISOString()).toBe('2026-07-14T03:30:00.000Z');
    expect(r[1].fireAt.toISOString()).toBe('2026-07-15T03:30:00.000Z');
    expect(r[0].occurrenceDate).toBe('2026-07-15');
    expect(r[1].occurrenceDate).toBe('2026-07-15');
  });

  it('day-before crosses the month boundary correctly (due on the 1st)', () => {
    const occ = { year: 2026, month: 8, day: 1 };
    const now = istWall(2026, 7, 20, 0, 0);
    const r = remindersForOccurrence(occ, now, 9, 0);
    expect(r[0].fireAt.toISOString()).toBe('2026-07-31T03:30:00.000Z'); // 31 Jul, 9 IST
    expect(r[1].fireAt.toISOString()).toBe('2026-08-01T03:30:00.000Z');
  });

  it('drops reminders already in the past', () => {
    const occ = { year: 2026, month: 7, day: 15 };
    // Now is the afternoon of the 15th (after 9:00 IST) — both reminders passed.
    const now = istWall(2026, 7, 15, 14, 0);
    expect(remindersForOccurrence(occ, now, 9, 0)).toEqual([]);
  });

  it('keeps only the day-of when the day-before already passed', () => {
    const occ = { year: 2026, month: 7, day: 15 };
    const now = istWall(2026, 7, 14, 14, 0); // afternoon of the 14th
    const r = remindersForOccurrence(occ, now, 9, 0);
    expect(r.map((x) => x.kind)).toEqual(['day_of']);
  });
});

describe('upcomingReminders', () => {
  it('monthly: schedules the next occurrence', () => {
    const now = istWall(2026, 7, 10, 12, 0);
    const r = upcomingReminders({ dueDay: 15, repeatMonthly: true }, now, 9, 0);
    expect(r.map((x) => x.occurrenceDate)).toEqual(['2026-07-15', '2026-07-15']);
  });

  it('monthly: rolls to next month when this occurrence is fully past', () => {
    // Afternoon of the due day → both of this month's reminders are gone.
    const now = istWall(2026, 7, 15, 20, 0);
    const r = upcomingReminders({ dueDay: 15, repeatMonthly: true }, now, 9, 0);
    expect(r.map((x) => x.occurrenceDate)).toEqual(['2026-08-15', '2026-08-15']);
  });

  it('monthly: month-end roll-forward does not skip a month', () => {
    // Due on the 31st, evening of 31 Jul → next should be 31 Aug, not Sep.
    const now = istWall(2026, 7, 31, 20, 0);
    const r = upcomingReminders({ dueDay: 31, repeatMonthly: true }, now, 9, 0);
    expect(r[0].occurrenceDate).toBe('2026-08-31');
  });

  it('one-time: schedules the given date, then nothing once it has passed', () => {
    const bill = { dueDay: 15, repeatMonthly: false, oneTimeDate: '2026-07-15' };
    const before = istWall(2026, 7, 1, 0, 0);
    expect(upcomingReminders(bill, before, 9, 0).length).toBe(2);

    const after = istWall(2026, 7, 16, 0, 0);
    expect(upcomingReminders(bill, after, 9, 0)).toEqual([]);
  });

  it('one-time: returns nothing when no date is set', () => {
    const now = istWall(2026, 7, 1, 0, 0);
    expect(upcomingReminders({ dueDay: 15, repeatMonthly: false }, now, 9, 0)).toEqual([]);
  });
});

describe('toISODate', () => {
  it('zero-pads month and day', () => {
    expect(toISODate({ year: 2026, month: 3, day: 5 })).toBe('2026-03-05');
    expect(toISODate({ year: 2026, month: 12, day: 25 })).toBe('2026-12-25');
  });
});
