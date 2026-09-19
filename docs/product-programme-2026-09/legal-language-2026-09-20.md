# Bilingual legal source — 20 September 2026

Implemented locally in mobile PrivacyPolicyScreen/TermsScreen and authoritative web privacy, account-deletion and terms pages, plus the Support page. English remains available. Hindi uses the existing saved language context; legal pages expose a language control and mobile legal screens offer a switch back to English. Text accessibility language and web article language identify the actual body language. The Support page also uses the selected body language; its subscription instructions distinguish the original store purchase from a web checkout provider.

The translation preserves the existing technical scope: optional account-linked measurement, current consent identifiers, billing subscription pseudonyms, excluded financial payload fields, 90-day history, physical maintenance versus report expiry, withdrawal and re-consent, Private Mode's server-measurement limitation, separate diagnostics, password-based deletion, external/backups retention uncertainty, and separate no-card 14-day trial checkout. Account export is not described as a complete backup. Existing legal clauses and monetary liability limit are preserved; no address or new legal assurance was invented.

Verification: mobile TypeScript and scoped ESLint passed. Two native component tests passed for Hindi/English switching, speech language, retention/billing/deletion notices, all terms sections and no-card trial wording. Final integrated client checks are owned by the localization/root lane.

Publication remains pending: human Hindi linguistic/legal approval, legal/entity/contact accuracy review, and the existing web terms address placeholder. Code implementation does not certify compliance, approve terms, publish pages or perform a deployment.
