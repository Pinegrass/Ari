# Current checkpoint — Android product release, 2026-09-11

Owner prioritises Android; phone use authorised. iPhone testing deferred to Codemagic/later. Pricing ₹149/month and ₹1,499/year, with14-day no-card trial, explicitly approved. BillDesk remains incomplete.

Android candidate befbe32 (isolated worktree, clean504tests/typecheck/lint), EAS6b9b0e9d-f36e-456a-8cb6-2657295b0c0b code58 building. Backend ed98d02 deployed on Railway21a1e26c-65c7-4d04-a55f-36c5a7ba3c6f; exact live revision verified. Four additive Supabase migrations applied with RLS/read-back checks. Backend299tests,66PostgreSQLchecks,28live authenticated synthetic-account checks pass; test accounts deleted. Deferred outbox automatic sends remain gated off. Web7d11e4f unchanged live. Full evidence: docs/product-programme-2026-09/android-completion.md.

The entries below are historical checkpoints. Their phone-free restriction, unapproved-pricing and wholly-undeployed product status are superseded by this checkpoint. v57 production submission remains a separate historical artifact.

# Current State
Updated: 2026-09-11
Task: ARI-RELEASE-VERIFY

Latest owner authorization: promote uploaded Android v57 to production, superseding the earlier internal-only/phone-retest-before-rollout gate. Production release8 / 1.3.0 (57) submitted for 100% of existing targeted countries. Play shows Changes in review with quick checks running; managed publishing off, so approval publishes automatically. Version51 rollout halted at10% to unlock replacement. No claim v57 is live or physically retested. Internal draft4 remains. See release report for exact artifact and evidence.

- VERIFIED release source: Android/mobile4b4ae8e; backend1d5ba6b; web7d11e4f. Three reproduced phone defects fixed. Android/mobile490tests, backend232tests, web5tests and relevant lint/typecheck/build PASS.
- VERIFIED backend/web exact commits deployed and pushed. Railway deploymentad50abee-fa85-42ae-b7e7-f71e74eedb34 reports1d5ba6b. All seven public endpoints200/no redirect; association files JSON with correct Play signing fingerprint and Apple47WKL6Q47D.com.pinegrass.ari. Latest scheduled job34581962910 success.
- VERIFIED Android AAB1.3.0/code57, EASbabe43bf-4a4f-4dc9-aacf-c9e31eb27841, internal-release channel/runtime84cc28590bb0a1fffcf4a346d97bd40e18faac45. Play internal draft4 saved, not rolled out. Phone held free by owner; v57 install/retest BLOCKED, Ari remainsv55.
- VERIFIED RevenueCat server key/authenticated production-only webhook, TEST200 and duplicate dedup. Owner-authorized Ari-only Play service-account permissions and existing JSON upload valid. Dedicated Ari-Play-Notifications topic received Play TEST13:38UTC.
- VERIFIED RevenueCat App Store app446098f465 created with existing purchase key893HSJ97DW; valid credentials. Public iOS key saved in Codemagic ari_ios. Apple sandbox notification TEST200/deliverySUCCESS, RevenueCat received14:05UTC. Production TEST401 remains UNVERIFIED.
- Canonical mobile HEAD and iOS candidate5ee13d35c41142680a4cae3c062c9ae2f4279585; tested in isolated worktree D:/Codex/Worktrees/ari-release-ios-20260911 / branch codex/ari-release-ios-20260911. Codemagic TestFlight-only/internal-release workflow; renewed Associated Domains profile with unchanged certificate, mandatory iOS SDK key, speech-recognition57.0.0 fixes Swift compatibility. Clean490tests/lint/typecheck PASS. Build23 /6aa40ac794b18d69f22eed8b archive/export/upload PASS. Apple accepted1.3.0/build6 (deliveryabed7314-f58a-439d-a8b3-d2fcdab8cfeb), approved in TestFlight for Aritester internal group (3 testers); focused test notes saved. IPA signed entitlement applinks:aritomo.in and shared app group verified; runtime10ed459ae0b1c274c2365f51dfadc4f353286aae/internal-release. Installation still UNVERIFIED.
- BLOCKED store billing: neither store has subscription products; RevenueCat Android products show Not found. Both Google payment accounts require BillDesk verification via primary-contact email from onboarding@billdesk.com; connected Gmail has no onboarding message. India payout method absent. Owner asked for verification and launch prices. No prices/banking data invented.
- BLOCKED Razorpay test checkout: existing secret masked and not found in requested Downloads search. Existing secret needed securely for isolated staging; no regeneration, production test-key switch or charge. Local payment contract regressions PASS, provider checkout UNVERIFIED.
- Concurrent task “Assess and strengthen Ari product” actively edits shared mobile/backend/web source. Preserve it; do not deploy dirty trees or apply candidate test claims to that work.

Evidence: docs/release-blocker-resolution-2026-09-11.md. Private logs/artifacts: D:/Codex/Artifacts/Ari/2026-09-11. No public mobile rollout or OTA.

## Product programme phase 2 — local checkpoint, 2026-09-11

Implemented mobile/web Tomo updates inboxes, anchored historical-report actions, confirmed dismissals, expanded Hindi controls and backend Expo receipt reconciliation with token-rotation protection. Local verification: mobile 500 tests, backend 272, web 9; typecheck/lint, web build and isolated PostgreSQL migrations pass. No phase-2 live delivery/browser/device QA is claimed. No commercial configuration or deployment changed. All programme source remains dirty/uncommitted in its owning repository; it is excluded from the release artifacts above.

Evidence: docs/product-programme-2026-09/phase-2.md and validation.md. Next: deferred outbox, remaining Hindi forms/accessibility, isolated staging/device contract checks, confirmed obligations/payday and measurement pipeline. Preserve the owner's phone-free instruction and separate release gates.

## Phase 3 — backend deferred review notifications, 2026-09-11

Implemented durable quiet-hour deferral for review/recurring-charge types, 24-hour expiry, fresh preference/token checks, source-dismissal cancellation, actual-attempt quotas/receipt age and bounded scheduler processing. Budget alerts/reactivation remain suppressed pending freshness rules. Full backend 284 tests, scoped Ruff, three repeated PostgreSQL migrations and overlapping-worker concurrency check passed. Provider mocked; staging/live delivery unverified. No mobile/web source changed, no deployment or commercial changes. Evidence: docs/product-programme-2026-09/phase-3.md. All product changes remain local/uncommitted; separate release evidence and phone-free instruction remain in force.
