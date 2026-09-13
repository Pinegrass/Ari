# Coordinated release — 13 September 2026

Owner requested completion of the next pending item: coordinated backend, Android internal OTA and web release. All three source branches pushed. No source changes were needed; previously passing verification remains mobile 556/backend 309/web 12 tests, types/scoped lint and web build. These suites were not repeated during this deployment-only turn.

| Surface | Source | Artifact | Outcome |
|---|---|---|---|
| Backend | b8556303627323581193967e6cd97b7676aef066 | Railway ba6152e3-8e20-4495-bad9-6ba1260b8455 | SUCCESS; exact health revision verified |
| Android | dfdaec15bccd87e5287e9a9cac3927adbc53c2f9 (implementation d0093c5) | Update 01a09ba2-b520-7bc6-a812-ca4382a245f2; group 860cb92d-cb0c-4ab1-8dee-15e7dd150c97 | Published internal-release; device installation UNVERIFIED |
| Web | 7a1533f2e82ad69b61960d753f1d2832e8f8800a | Vercel dpl_12kGaGyRybh341rWWq9HH5r2YwpA | READY production; aritomo.in alias verified |

Android runtime f82b9c561785202f8057920d7a8a052d15c1ed33 independently fingerprinted and matches v61. Production EAS environment supplies live API settings; distribution channel remains internal-release. No native build, Play submission, production-channel OTA or iOS release.

40 live backend checks passed using an isolated synthetic account: Supabase authentication, authenticated API access, INR paise create/edit/read/summary/report, excess precision rejection, planning expiry, default 21/week, saved lower cap, invalid cap rejection, trial endpoint, confirmed obligation priority, acknowledged dismissal and persisted suppression, invalid identity rejection, account/data cleanup. Direct Supabase read confirmed Railway writes. Fixture identity, app profile and transactions removed and absence checked. This verifies persisted dismissal on production PostgreSQL, not concurrent daily-worker behavior.

Additional checks: unauthenticated daily endpoint rejected; authenticated call returns enabled:false, checked:0 and no cursor. Railway DAILY_NUDGES_ENABLED explicitly false; GitHub variable unset. CORS permits aritomo.in on dismissal. Deployment-scoped HTTP500–599 log query returned no entries at this point in time.

Web cloud build logs identify commit 7a1533f and Next16.3.2, successful 16-second build. Production landing and sign-in navigation rendered in browser, no console errors observed. Hindi form switch works; existing surrounding English promotional copy remains a localization gap. Browser language restored and temporary tab closed. Browser checks did not exercise authenticated web dashboard or checkout; authenticated backend checks are separate evidence.

No actual push/receipt delivery, concurrent daily-worker test or physical-device testing this turn. Automatic daily/outbox delivery stays gated pending acceptance. Commercial provider/store/Play permissions, real purchase and restore, deferred iPhone, full Hindi/accessibility and operational/pilot gates remain open.

Rollback references: backend c05a77f / deployment14764053-885e-4299-a78b-8f17faf32068; web dpl_3joTPzY2kpMidiFCkLWmaxtjmCuP; Android group ea93b358-a687-4c4d-9ab6-a60d32c67317. Coordinate backend rollback with clients because the prior backend lacks acknowledged Home dismissal.

Private evidence under D:/Codex/Artifacts/Ari/: release-live-check-2026-09-13.json and script, release-android-2026-09-13.json, release-2026-09-13-fingerprint.json, web-release-2026-09-13.json. No secrets in this report or Git.

Next item: isolated real notification delivery/receipt and daily-worker PostgreSQL concurrency acceptance, then deliberate scheduler enablement. Android installation and targeted Home/action acceptance remain unverified.
