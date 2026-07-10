# Ari — Privacy Policy

**Effective date:** _(set on day of publish — must be set before linking from Play Console)_
**Last updated:** _(same as effective date for v1)_

> **This is a starting draft, not legal advice.** It is written for the Ari mobile app as currently scoped: Google account sign-in, user-typed financial transactions, no advertising SDKs, no payment processing, no sharing of personal data with third parties beyond infrastructure providers (Google for auth, Sentry for crash reporting, Railway for backend hosting). **A qualified lawyer in your jurisdiction must review before publishing.** If Ari adds features that change data flows (SMS reading, location, contacts, payments, ads, ML training on user data), this policy must be updated.

---

## 1. Who we are

Ari is operated by **Pinegrass** ("we", "us", "our"). You can reach us at **support@pinegrass.app**.

## 2. What this policy covers

This policy describes how we collect, use, and protect personal information when you use the Ari mobile app and any web pages we operate that link to this policy.

## 3. Information we collect

### 3.1 Information you give us

| What | Why | Required? |
|---|---|---|
| Email address | To create your account and sign you in | Yes |
| Display name | To personalize the app | Yes (collected from your Google account) |
| Transaction data you type into the app (amounts, descriptions, categories, dates) | To provide the core service of the app | Yes |
| Optional notes you write about transactions | To provide the core service of the app | No |

### 3.2 Information we collect automatically

| What | Why |
|---|---|
| Device type, OS version, app version | To diagnose crashes and bugs (via Sentry) |
| Crash reports and error logs | To find and fix bugs (via Sentry) |
| Approximate region (derived from IP) | To diagnose regional issues only — we do not store precise location |
| Anonymous usage events (which screens are visited) | To improve the app — we do not associate these with your identity |

### 3.3 Information we do NOT collect

- We do not collect your contacts, calendar, photos, or files.
- We do not read your SMS messages.
- We do not access your location continuously.
- We do not record audio or video.
- We do not collect payment information (Ari does not process payments).

## 4. How we use your information

We use the information described above to:

- Provide the Ari service — show your transactions, calculate totals, save your preferences.
- Keep you signed in across app launches.
- Diagnose bugs and crashes.
- Communicate with you about important account events (e.g. account deletion confirmation).
- Comply with legal obligations.

We do **not** use your information for advertising. We do not sell, rent, or trade your personal information.

## 5. Who we share information with

We share information only with the service providers required to operate Ari:

| Provider | What they do | What they receive |
|---|---|---|
| **Google** | Authenticates your sign-in | Your email, name, profile picture (per OAuth scopes you approve) |
| **Sentry** | Crash and error reporting | Device info, stack traces, breadcrumbs (with auth tokens scrubbed) |
| **Railway** | Hosts our backend servers | Your account data and transactions (this is where they live) |

Each of these providers has its own privacy policy. They are contractually required to process data only on our behalf.

We may also disclose information if required by law, valid legal process, or to protect the rights and safety of Ari users.

## 6. International transfers

Our backend infrastructure (Railway) is currently hosted in the United States. If you use Ari from outside the United States, your information will be transferred to and stored in the United States. By using Ari you consent to this transfer.

## 7. How long we keep your information

- **Account data:** as long as your account exists.
- **Transactions you log:** as long as your account exists, unless you delete them.
- **Crash reports:** up to 90 days, then automatically purged.
- **Anonymized audit records:** up to 90 days after account deletion, then purged.

## 8. Your rights

You can, at any time:

- **Access** your data — every screen in Ari shows you the data we hold about you.
- **Correct** your data — edit or delete individual transactions within the app.
- **Delete your account** and all associated data — via **Settings → Delete account** in the app, or via our web form at https://pinegrass.app/delete-account. We will fully purge your data within 30 days.
- **Export your data** — _(if a data export feature ships, document it here. Otherwise, email support@pinegrass.app)_.
- **Withdraw consent** — by signing out and deleting your account.

Depending on where you live, you may have additional rights under local law (e.g. GDPR for the EU/UK, CCPA for California, the Kenya Data Protection Act 2019 if Ari operates in Kenya, etc.). To exercise any of these rights, email **support@pinegrass.app**.

## 9. Children

Ari is not intended for use by children under the age of 13 (or the equivalent minimum age in your country). We do not knowingly collect personal information from children. If you believe a child has provided us with personal information, email us and we will delete it.

## 10. Security

We use industry-standard security measures, including HTTPS for all network traffic, encryption of credentials at rest, and access controls on our infrastructure. No security measure is perfect — we encourage you to use a strong password and to keep your device locked.

## 11. Changes to this policy

We may update this policy from time to time. The "Last updated" date at the top tells you when. For material changes (e.g. new categories of data collected, new sharing partners), we will notify you in the app before the change takes effect.

## 12. Contact

Questions, concerns, or requests under this policy can be sent to:

**Pinegrass**
support@pinegrass.app

---

## Legal-review checklist (delete before publishing)

Items the dev / founder / lawyer must verify before this policy can be linked from Play Console:

- [ ] **Legal entity name** — "Pinegrass" is the brand. Insert the registered legal name (LLC, Limited, etc.) where required.
- [ ] **Jurisdiction-specific rights** — the Section 8 paragraph needs concrete citations and procedures for the jurisdictions Ari actually operates in. If targeting Kenya, include Kenya DPA 2019 obligations specifically. If EU/UK, add GDPR Article 15-22 rights with specifics. If California, add CCPA-mandated language.
- [ ] **"Anonymized usage events"** — confirm with engineering whether this is actually true. If product analytics are wired with a per-user ID (Mixpanel, Amplitude, Firebase Analytics with user IDs), update Section 3.2 to reflect that.
- [ ] **Encryption at rest** — confirm with infra whether the Railway-managed database has encryption at rest enabled. If not, either enable it or remove that claim from Section 10.
- [ ] **Data export** — Section 8 mentions export as conditional. Either build it (recommended for trust) or replace with the email-support fallback explicitly.
- [ ] **DPO requirement** — if EU/UK presence, may need a designated Data Protection Officer or EU representative.
- [ ] **Children's age** — Section 9 says 13. Check the local minimum in markets you target (e.g. Korea is 14, EU varies 13-16 per member state).
- [ ] **Notice period for material changes** — if you commit to a specific notice period (e.g. 30 days), document that. Some jurisdictions require it.
- [ ] **Effective date** — set, both at the top and in any deep links from the app.
- [ ] **Companion Terms of Service** — typically published alongside. Not in this PR but should land before/with this policy.

## Hosting

This policy should be hosted at a stable URL. Suggested:

- https://pinegrass.app/privacy
- or, if no marketing site exists yet, a Railway-served static route

The URL goes in **Play Console → App content → Privacy policy** before submission.
