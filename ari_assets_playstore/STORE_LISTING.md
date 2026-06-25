# Ari — Play Console Store Listing

**v1.1.0 — Sprint 4 refresh. Reviewed for Play Store compliance: no "lending/loan/EMI/NBFC/investment-advice" language.**

---

## App details

| Field | Value | Notes |
|---|---|---|
| App name | `Ari — AI Money Coach` | 21 chars (Play limit: 30) |
| Default language | `English (United States)` | Add Hindi in v1.2 |
| App or game | App | |
| Free or paid | Free | Premium gated off in v1 |
| Category | Finance | Subcategory: Personal Finance |
| Tags | budget, expense tracker, money manager, savings tracker, tax calculator | Up to 5 |
| Email | starhunter7@gmail.com | Public contact |
| Phone | (optional) | Skip for v1 |
| Website | https://web-production-7c65f.up.railway.app | Custom domain v1.2 |
| Privacy Policy URL | https://web-production-7c65f.up.railway.app/privacy | DPDP-compliant, live |

---

## Short description (80 chars max)

```
Track spending, set budgets, and get AI money coaching — built for India
```
*(72 chars)*

---

## Full description (4000 chars max)

```
Take control of your money with Ari — an AI-powered personal finance app built for India.

Ari helps you understand where your money goes, plan smarter budgets, and build savings habits that actually stick. Designed for salaried professionals and freelancers, Ari combines fast expense logging with an intelligent AI coach (Tomo) that answers your money questions in plain English.

✦ LOG EXPENSES IN SECONDS
• Tap a number — the keypad-first Add screen gets you to Done in under 3 seconds
• Voice input — say "spent 350 on groceries" and Ari logs it
• Share any bank SMS or payment alert directly to Ari — it reads the amount and merchant automatically
• Smart merchant detection — Swiggy, Zomato, Uber, Amazon, IRCTC and more recognised automatically
• Recurring transactions — set Monthly, Weekly, or Quarterly repeats once and forget

✦ MEET TOMO, YOUR AI MONEY COACH
• Ask anything about your spending: "Where can I cut back this month?"
• Personalised insights based on your actual transactions
• Friendly, jargon-free advice in English
• Tomo never recommends specific products — for any product decision, Tomo will point you to a SEBI-registered adviser

✦ BUDGETS THAT WORK
• Set monthly budgets per category
• See your progress at a glance with colour-coded progress bars
• Get gentle nudges when you're approaching a limit
• Roll over unused budget to next month

✦ SAVINGS GOALS
• Create goals for that vacation, new laptop, or emergency fund
• Track contributions over time
• Visual progress to keep you motivated

✦ TAX ESTIMATOR (FY 2025-26)
• Compare Old vs New Regime side-by-side
• Estimate Section 80C, 80D, HRA exemption, home loan interest
• Built with the latest FY 2025-26 slabs
• For estimation only — file with your CA or tax professional

✦ DAILY HEATMAP & REPORTS
• See your spending pattern at a glance
• Monthly P&L report — income vs expenses vs net savings
• Category trend charts over 3 or 6 months
• Identify spending spikes early

✦ INDIA-FIRST DESIGN
• Indian Rupee (₹) formatting throughout
• UPI deep-link settlement for shared expenses
• Built by an Indian solo founder for Indian users

✦ WORKS OFFLINE
• Add transactions without a data connection — Ari syncs when you're back online
• Your data is never lost even if the server is unreachable

✦ PRIVATE BY DEFAULT
• Private Mode hides amounts and pauses analytics with one tap
• Sessions encrypted on-device using OS-level secure storage
• Your data stays your data — we never sell to advertisers
• Full data export and account deletion available in Settings

✦ FREE FOREVER (v1)
Ari v1 is completely free — no ads, no paywall, no subscriptions. Premium features may launch in future versions, but core tracking and Tomo AI coaching will always have a free tier.

DPDP COMPLIANT: Ari complies with India's Digital Personal Data Protection Act 2023. Grievance Officer: starhunter7@gmail.com.

Note: Ari is a personal finance tracker and AI coaching tool. It does not provide investment, tax, or legal advice. For specific financial decisions, please consult a SEBI-registered investment adviser or qualified Chartered Accountant.
```

*(Approximately 2,900 chars — fits with room to spare)*

---

## What's new (release notes — 500 chars max)

```
Ari v1.1.0

✦ Recurring transactions — set Monthly, Weekly or Quarterly repeats once
✦ Share bank alerts to Ari — it reads the amount and merchant automatically
✦ New forest-on-cream design — easier on the eyes in daylight
✦ Faster expense entry with the new keypad-first Add screen
✦ Works offline — transactions sync when you're back online
✦ Edit transactions — change amount, category or date after saving
```

*(~460 chars)*

---

## Screenshot set (v1.1.0 — 8 screens, forest-on-cream UI)

Screenshots should be taken from the new forest-on-cream build. Order:

1. **Dashboard** — cream bg, forest hero block with balance, recent transactions list
2. **Add transaction (keypad)** — keypad-first screen with Quick Amounts row
3. **Share-to-Ari** — bottom sheet showing parsed amount + merchant from a shared bank SMS
4. **Tomo chat** — forest user bubble, Tomo response to "Where can I cut back this month?"
5. **Budgets** — category budget bars with clay progress fill
6. **Savings goals** — 2 goals with progress rings and target dates
7. **Tax estimator** — Old vs New regime comparison, FY 2025-26 slabs
8. **Recurring transactions** — Add screen with Repeat toggle + rule pills

---

## Data Safety form answers

When filling out Play Console > Policy > Data Safety, use these answers:

### Data collection summary

| Data | Collected | Shared | Required | Purpose | Encrypted in transit | User can delete |
|---|---|---|---|---|---|---|
| Name | YES | NO | NO | Account management | YES | YES |
| Email | YES | NO | YES | Account management, App functionality | YES | YES |
| Phone | NO | — | — | — | — | — |
| User payment info | NO* | — | — | — | — | — |
| Other financial info (transactions you log) | YES | NO | YES | App functionality | YES | YES |
| Photos | NO | — | — | — | — | — |
| Voice or sound recordings | NO** | — | — | — | — | — |
| Files & docs | NO | — | — | — | — | — |
| App interactions | YES | NO | NO | Analytics | YES | YES |
| Other user-generated content | YES (notes, goals, categories) | NO | NO | App functionality | YES | YES |
| Crash logs | YES | NO | NO | Analytics | YES | YES |
| Diagnostics | YES | NO | NO | Analytics | YES | YES |
| Other app performance data | YES | NO | NO | Analytics | YES | YES |
| Device or other IDs | YES (PostHog anonymous ID) | NO | NO | Analytics | YES | YES |
| Approximate location | NO | — | — | — | — | — |
| Precise location | NO | — | — | — | — | — |

*v1 free, no payment info collected. When paywall flips on (v1.1+): YES, Required, "Account management" purpose.

**Voice is processed on-device by expo-speech-recognition for transcription only. The audio is NOT uploaded or stored. Only the resulting text is sent to our backend if the user confirms.

### Other declarations

- **Follows Play Families Policy**: NO (target audience is 18+)
- **Independently security reviewed**: NO (mark "We have not had our security practices independently reviewed")
- **Data is encrypted in transit**: YES (HTTPS/TLS)
- **Users can request data deletion**: YES (in-app via Settings → Delete Account, or POST `https://web-production-7c65f.up.railway.app/auth/account` with token)

---

## App Content questionnaire

| Question | Answer |
|---|---|
| Target age groups | 18+ |
| Contains ads | NO |
| In-app purchases | NO (v1) — flip when paywall enables |
| Government app | NO |
| Financial features | YES → Personal finance management. We are NOT a regulated NBFC, lender, or investment platform. We do not facilitate transactions or hold funds. |
| News app | NO |
| Health features | NO |

### Content rating (IARC questionnaire)

For Ari (no violence, no sexual content, no gambling, no user-generated public content):

- Violence: None
- Sexual content: None
- Profanity: None
- Drugs/alcohol/tobacco: None
- Gambling: None
- User communication: NO (no chat between users)
- User-generated content: NO (private to each user)
- Personal information sharing: NO
- Digital purchases: NO (v1)
- Location: NO

Expected rating: **Everyone (3+)** or equivalent regional rating.

---

## Submission checklist (v1.1.0)

- [ ] Updated short description, full description, and What's New above
- [ ] Uploaded 8 new forest-on-cream screenshots (see set above)
- [ ] Feature graphic — update with new cream/forest palette if time allows
- [ ] Pasted Privacy Policy URL (unchanged)
- [ ] Data Safety form — no changes needed from v1.0
- [ ] App Content — no changes needed from v1.0
- [ ] Set release name: `1.1.0 (6)` (versionCode 6 via autoIncrement)
- [ ] Upload new AAB (vc6, v1.1.0)
- [ ] Submit to Internal Testing → smoke test on device
- [ ] Promote to Production
- [ ] Expand rollout: 20% India → 100% India
- [ ] Push OTA update to `production` branch after QA pass
