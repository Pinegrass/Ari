# Combined notification channels — source audit14 September 2026

No device access, send, schedule mutation or provider call. Static source audit only; runtime combined experience remains unverified.

| Channel | Schedule / controls | Shared server budget? |
|---|---|---|
| Server daily nudges | 9/14/19 user-timezone opportunities; 3/local day, default 21/rolling week; saved lower limits, quiet hours, categories and push opt-out | Yes; jobs/push.py counts server attempts across daily and legacy types |
| Local Tomo check-ins | Tuesday/Friday, saved local time (default20:00); local AsyncStorage enable/time; OS permission | No; src/hooks/useNotifications.ts schedules directly with Expo Notifications |
| Local bills | Day-before/day-of upcoming occurrences, per-bill scheduling/cancellation and OS permission | No; src/lib/bills.ts bypasses backend preferences and delivery ledger |
| Local test button | Immediate user-triggered tomo_checkin | No; test action is separate from automatic sends |

Implication: enabling daily server nudges does not enforce a product-wide three-notification ceiling. On Tuesday/Friday an enabled local check-in can coexist with three eligible server opportunities, plus bill reminders. Server quiet hours, category opt-out and lower caps do not automatically alter these local schedules. Turning off local check-ins intentionally preserves bills; turning off server push does not cancel local OS schedules.

The user requested three daily nudges; the existing implementation documents three useful server opportunities rather than three guaranteed messages. Before broad activation, review notification settings wording and combined channel acceptance. Do not silently cancel user-created bill reminders or claim a global cap. Any future unified policy must preserve offline bill reminders, user choices and distinguish optional coaching from explicit reminders.

Evidence: src/hooks/useNotifications.ts CHECKIN_IDS/CHECKIN_WEEKDAYS, scheduleReminderAt and toggleNotifications; src/lib/bills.ts scheduleBillReminders; backend/jobs/push.py; backend/jobs/nudge_policy.py; backend/jobs/daily_nudges.py. No source changes this audit. S1 combined-channel source inventory is complete; runtime acceptance stays pending by owner.
