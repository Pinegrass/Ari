# Ari — Play Store listing copy

Ready-to-paste copy for Google Play Console → **Store presence → Main store listing**. Two versions: a conservative one that only references features I can verify exist (auth, manual logging), and a fuller version that assumes a standard expense-tracker feature set.

The user/PM should pick the closer match to the actual shipped product and edit from there.

---

## App name (≤30 chars)

`Ari — Money, made simple` (24 chars)

Alt: `Ari` (3 chars — clean, brand-first; rely on short description for context)

---

## Short description (≤80 chars)

**Recommended:**

```
Money, without the math. Track what you spend, save, and have left.
```

(67 chars)

Alt for ASO (keyword-leaning):

```
Simple expense tracker & budget app. Less spreadsheet, more living.
```

(67 chars)

---

## Full description — Conservative version (~600 chars, safe to ship today)

```
Money, without the math.

Ari is the simplest way to track what you spend, what you save, and what you actually have left. No spreadsheets. No complicated budgets. Just open the app, add what happened, and Ari handles the rest.

WHY ARI
• Faster than the apps you've tried before — no menus, no forms.
• Quiet by design — Ari nudges, it doesn't nag.
• Clean, calm interface that doesn't make you feel bad about money.

PRIVATE BY DEFAULT
Your data stays yours. We don't sell it, we don't share it, and you can delete everything any time.

SIGN IN ONCE
Sign in once and Ari remembers you. No re-logging in every time you open the app.

For people who'd rather live their lives than reconcile spreadsheets.
```

---

## Full description — Standard version (~1100 chars, use if these features actually ship)

> **Verify before pasting** — every WHAT YOU CAN DO bullet must be a real feature in the shipped app. False advertising on Play violates policy and tanks store ratings.

```
Money, without the math.

Ari is the simplest way to track what you spend, what you save, and what you actually have left. No spreadsheets. No complicated budgets. Just open the app, add what happened, and Ari handles the categorizing, the math, and the memory.

WHAT YOU CAN DO
• Log spending in seconds — type it once, never lose track again.
• See your real balance — what you have left after the essentials, not before.
• Spot patterns — where your money actually goes, week by week.
• Set quiet budgets — gentle nudges, not guilt.
• Multi-currency — log in any currency, see totals in yours.

WHY ARI
• Faster than the apps you've tried before — no menus, no forms.
• Quiet by design — Ari nudges, it doesn't nag.
• Clean, calm interface that doesn't make you feel bad about money.

PRIVATE BY DEFAULT
Your data stays yours. We don't sell it, we don't share it, and you can delete everything any time.

SIGN IN ONCE
Sign in once and Ari remembers you. No re-logging in every time you open the app.

For people who'd rather live their lives than reconcile spreadsheets.
```

---

## What's new / release notes (≤500 chars — this build)

```
What's new:
• Sign in once — we remember you. No more logging in every time.
• Smoother Google sign-in for new installs.
• Welcome tour: a quick intro for first-time users.
• Friendlier error messages when something doesn't work.

Thanks for using Ari.
```

(~325 chars)

---

## Screenshot captions (up to 8 — pick the first N matching the actual screens)

1. **Money, without the math.**
2. **Add it in seconds.**
3. **See where it actually goes.**
4. **Stay on track, your way.**
5. **Private. Always yours.**
6. **One tap. Done.**
7. **Set quiet budgets.**
8. **Your money, your data.**

Caption style guide:
- One headline per screenshot, ≤6 words.
- Sentence case or title case — pick one and stick to it.
- Sub-line optional, ≤12 words, only if the screen genuinely needs explanation.

---

## Categorization

- **Category:** Finance
- **Tags (Play allows ~5):** Personal finance, Budgeting, Expense tracker, Money manager, Spending tracker

---

## ASO keyword targets (woven naturally — no stuffing)

Primary: `expense tracker`, `budget app`, `money tracker`
Secondary: `personal finance`, `spending tracker`, `budget planner`, `money manager`

The full descriptions above already weave these in. Don't add a "Keywords:" section — Play doesn't have one, and stuffing them anywhere visible gets the listing demoted.

---

## Content rating + data safety form

Don't skip — Play won't promote the listing without them.

- **Target audience:** 18+
- **Data collected:** email, name (Google account profile), spending entries (user-typed)
- **Data shared with third parties:** none (verify this with backend team before submitting)
- **Data encrypted in transit:** yes (HTTPS to Railway)
- **Data encrypted at rest:** verify with backend team before claiming
- **User can request deletion:** must implement a real account deletion flow before launch — Play requires it for apps that hold user accounts. If this isn't built yet, **flag immediately** — it's launch-blocking, not optional.

---

## What still needs a human decision

1. **Pick conservative or standard** full description based on what's actually built.
2. **Verify the "data encrypted at rest" claim** with the backend team before checking that box on the Data Safety form.
3. **Confirm the account deletion flow exists** — Play policy requires it.
4. **App icon** — if it reads as dark/heavy, consider a light variant to match the new positioning.
