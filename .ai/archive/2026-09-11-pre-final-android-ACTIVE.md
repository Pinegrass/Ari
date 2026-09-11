# Active task: Android product completion

Owner latest: BillDesk verification is not complete; defer iPhone testing to Codemagic/later; complete Android now. Both devices were previously offered; Android phone use is authorised. Approved ₹149/month, ₹1,499/year and14-day no-card trial.

Backend ed98d02 deployed and verified; four additive migrations live;299tests/66PostgreSQLchecks/28live APIchecks pass. Android befbe32/code58 building in EAS6b9b0e9d-f36e-456a-8cb6-2657295b0c0b. Next: validate artifact, install on SamsungR9ZY6046FML, exercise new and regression flows, record exact bundle identity, release internal candidate once verified. Payment catalog403 and BillDesk prevent real purchase completion. Web product changes remain local.

Evidence: docs/product-programme-2026-09/android-completion.md. Previous task checkpoints below are historical; superseded restrictions do not apply.

# Active Task
ID: ARI-RELEASE-VERIFY
Title: Resolve mobile, web and backend external release blockers
Status: ACTIVE — verified fixes/configuration; iOS build6 approved for internal TestFlight; device and merchant gates pending.

Scope: Owner now explicitly authorizes Android production promotion of uploaded v57. Release8 submitted for full rollout, currently Google quick checks/review, automatic publishing after approval. iOS remains TestFlight only. No OTA or real charges. Physical v57 retest remains unverified; no phone access performed.

Completed: mobile defect fixes, full local gates, exact backend/web deployments, live associations, RevenueCat server/webhook validation, Ari-only Play access and Google notification test, iOS RevenueCat configuration and Apple sandbox notification test. v57 AAB validated and saved in Play draft4.

Current: Codemagic build23 /6aa40ac794b18d69f22eed8b on isolated source5ee13d3, TestFlight-only with updated profile, iOS SDK key and SDK57-compatible speech module.490tests/lint/typecheck PASS. Archive/export/upload PASS, Apple accepted1.3.0/build6; TestFlight APPROVED for Aritester internal group (3 testers). Signed IPA identifiers, deep-link entitlement, shared group and update channel verified.

Required owner input: renewed phone availability (currently explicitly held free), BillDesk merchant verification, actual monthly/yearly/lifetime launch prices, secure existing Razorpay Test secret. Both stores lack subscription products; RevenueCat Android products Not found. Earlier copy-Play-prices proposal withdrawn because no verified prices exist.

Remaining verification: physical iOS install, v57 device regression pass/internal rollout, actual store purchases/restores and isolated Razorpay checkout/entitlement chain. Apple production test401 remains unverified; sandbox delivery succeeds.

Concurrent product source is dirty and belongs to another task; preserve it. Evidence: docs/release-blocker-resolution-2026-09-11.md.

## ARI-PRODUCT-PROGRAMME — phase 2 implemented locally

Latest user direction: proceed with the next implementation phase. Completed updates inboxes on mobile/web, historical report links, receipt reconciliation/migration/scheduler configuration and expanded Hindi controls. Final checks: 500 mobile / 272 backend / 9 web tests, lint/typecheck, web build, isolated PostgreSQL migrations pass. Evidence: docs/product-programme-2026-09/phase-2.md. No deployment or commercial changes. Remaining programme work: outbox/quiet-hour deferral, full Hindi/native review, staging/device QA, confirmed obligations/payday, measurement pipeline and owner commercial decisions. Separate release task above retains its device/merchant gates.

## ARI-PRODUCT-PROGRAMME — phase 3 implemented locally

Completed deferred review/recurring-charge outbox, expiry and cancellation, attempt-based quota/receipt timing, scheduler wiring and PostgreSQL concurrency verification. Backend 284 tests pass. Phase 3 evidence: docs/product-programme-2026-09/phase-3.md. Remaining: Hindi/native review, staging/client/delivery checks, retention and throughput, confirmed obligations/payday, measurement and commercial decisions. No release or pricing changes.
