> **Audit only — do not build anything from this list without founder sign-off.**

# Ari — Competitive Feature Gap Study

**Benchmarked apps:** Walnut, Money Manager (By Becky), YNAB (You Need A Budget), Spendee.
**Method:** Play Store + App Store listings, public feature descriptions, screenshots, and known category capabilities. No reverse engineering or ToS violation.
**Date:** 2026-07-01

## How to read this list

- **User value:** High = expected by most target users; Medium = nice-to-have; Low = niche.
- **Implementation effort:** Small = days; Medium = weeks; Large = months / new backend infra.
- **iOS release relevance:** Yes = should be considered before App Store launch; No = post-launch.

## Gap list

| # | Feature | Present In | User Value | Effort | iOS Relevance | Notes |
|---|---------|------------|------------|--------|---------------|-------|
| 1 | **Bank / AA account aggregation** | Walnut, YNAB, Spendee | High | Large | No | Indian Account Aggregator (RBI) integration. Major differentiator but heavy compliance/ops work. |
| 2 | **Automatic SMS/bank statement parsing** | Walnut, Money Manager | High | Medium | Yes | Ari already parses shared text via AI. Auto-reading SMS in background is technically possible but Android-biased and permission-sensitive on iOS. |
| 3 | **Recurring transaction intelligence** | YNAB, Spendee, Money Manager | High | Medium | Yes | Detect subscriptions and recurring bills, surface upcoming charges. Backend rules + UI card. |
| 4 | **Multi-currency support** | Money Manager, Spendee, YNAB | Medium | Medium | No | Useful for freelancers/travelers. Requires currency conversion API and schema changes. |
| 5 | **Shared household / group budgets** | Spendee, YNAB | Medium | Medium | No | Ari has basic group expenses but not shared budget envelopes. |
| 6 | **Bill / due-date reminders** | Walnut, Money Manager | High | Small | Yes | Push reminders for rent, EMI, credit-card bills. Uses existing notification infra. |
| 7 | **CSV / OFX / PDF import & export** | Money Manager, YNAB, Spendee | Medium | Medium | No | YNAB-grade import is complex; basic CSV export is small. |
| 8 | **Desktop / web companion** | YNAB, Spendee | Medium | Large | No | Requires building a web app or PWA sharing the same backend. |
| 9 | **Savings envelopes / zero-based budgeting** | YNAB | High | Medium | No | YNAB's core methodology. Ari has goals but not envelope-based allocation. |
| 10 | **Investment / portfolio tracking** | Walnut, YNAB | Medium | Large | No | Mutual funds, stocks, PF/PPF tracking. Regulated and complex for India. |
| 11 | **Smart split / settle-up with UPI** | Walnut, Spendee | High | Medium | Yes | Ari has UPI VPA field and group expenses. A "settle now" UPI intent flow would close the loop. |
| 12 | **Advanced reporting (PDF/Excel)** | Money Manager, Spendee | Low | Small | No | Monthly PDF report. Can reuse existing PnL data. |
| 13 | **Widgets (home screen / lock screen)** | YNAB, Money Manager | Medium | Small | Yes | iOS 16+ widgets showing "spent today" or budget status. Native module work. |
| 14 | **Wearable support (Watch)** | YNAB, Money Manager | Low | Medium | No | Quick expense entry from Apple Watch. |
| 15 | **Dark-mode toggle / theming** | Most apps | Low | Small | Yes | Ari currently forces dark UI via `userInterfaceStyle: "dark"`. A toggle is low effort but not release-blocking. |

## Ranked recommendations

### Build next (highest value / smallest effort)
1. **Bill reminders** — small effort, high user value, uses existing push notification code.
2. **Smart settle-up with UPI intent** — medium effort, high value for Indian groups, builds on existing group feature.
3. **Recurring transaction intelligence** — medium effort, high value, good Tomo integration story.

### Build later (medium effort, strategic)
4. **CSV export** — supports tax filing and power users.
5. **Savings envelopes / zero-based budgeting** — strong differentiator vs. basic trackers.
6. **Widgets** — good App Store screenshot story.

### Build only after product-market fit (large effort)
7. **Bank / AA aggregation** — compliance-heavy but potentially category-winning.
8. **Investment / portfolio tracking** — large scope, regulatory considerations.
9. **Desktop / web companion** — significant ongoing maintenance.

## Competitive positioning takeaways

- **Walnut** competes on auto-tracking and bill-splitting; Ari competes on simplicity, AI coach, and offline-first design.
- **Money Manager** competes on flexibility and export; Ari competes on Indian tax/goals and Tomo.
- **YNAB** competes on methodology and education; Ari's Tomo coach can fill a similar role with less friction.
- **Spendee** competes on shared budgets and design; Ari's forest-on-cream design is distinctive, but shared budgets are a gap.

## Suggested messaging for App Store

Highlight what Ari already does well rather than chasing every gap:
- "India-first finance tracker with built-in tax estimator."
- "AI coach that learns your spending and gives real advice."
- "Offline-first: log expenses instantly, sync when you're online."
- "Beautiful charts, no spreadsheets."

## Sign-off required

None of the gaps above are implemented in this sprint. Implementation requires founder prioritization and, where noted, backend/Product input.
