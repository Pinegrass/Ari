# Current State
Parent baseline: clean `master` at `ef1a3c6f6dc0`. Nested `aritomo-web` is clean at `be5f32a2deeb`; nested `backend` clean at `b3dc6589e7c0`. A separate older `D:\Codex\Workex\aritomo-web` checkout at `6b08411` was not selected.

Product: a mobile/web personal-finance tracker and bounded AI coaching system.

- Mobile finance workflows, secure token storage, offline cache, analytics, reports/referrals/auth upgrades — VERIFIED IN CODE under `src/`.
- Supabase-linked support/migrations and EAS/TestFlight config — VERIFIED IN CODE; current remote/build state UNVERIFIED.
- Web parity and Razorpay checkout — VERIFIED IN NESTED CODE at the newer nested web HEAD.
- Flask/Railway API, PostgreSQL models, Tomo/coaching/jobs, RevenueCat and Razorpay endpoints — VERIFIED IN NESTED CODE; provider/deployment health UNVERIFIED.
- Release — PARTIAL: handoffs report TestFlight and live web Razorpay, not independently exercised here.
