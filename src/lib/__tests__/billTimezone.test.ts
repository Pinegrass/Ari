import { calendarToday, remindersForOccurrence, nextMonthlyOccurrence } from '../billSchedule';

it('uses the requested calendar near UTC midnight instead of imposing IST', () => {
  const now = new Date('2026-03-01T00:30:00Z');
  expect(calendarToday(now, 'America/Los_Angeles')).toEqual({ year: 2026, month: 2, day: 28 });
  expect(calendarToday(now, 'Asia/Tokyo')).toEqual({ year: 2026, month: 3, day: 1 });
  expect(nextMonthlyOccurrence(31, now, 'America/Los_Angeles')).toEqual({ year: 2026, month: 2, day: 28 });
});

it.each([
  [{ year: 2026, month: 3, day: 8 }, '2026-03-07T14:00:00.000Z', '2026-03-08T13:00:00.000Z'],
  [{ year: 2026, month: 11, day: 1 }, '2026-10-31T13:00:00.000Z', '2026-11-01T14:00:00.000Z'],
] as const)('keeps nine AM local across DST boundaries %j', (date, before, on) => {
  const reminders = remindersForOccurrence(date, new Date('2026-01-01T00:00:00Z'), 9, 0, 'America/New_York');
  expect(reminders.map(row => row.fireAt.toISOString())).toEqual([before, on]);
});

it('handles a half-hour-offset zone without rounding the reminder', () => {
  expect(remindersForOccurrence({ year: 2026, month: 9, day: 20 }, new Date('2026-09-01'), 9, 0, 'Asia/Kolkata')[1].fireAt.toISOString()).toBe('2026-09-20T03:30:00.000Z');
});
