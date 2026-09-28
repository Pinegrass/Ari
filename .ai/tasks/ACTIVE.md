# Active task: ARI release acceptance

28 September remediation is implemented locally for mobile and live for backend/web. Backend `ed2af90` is healthy; the scoped manual and scheduled-event receipt runs passed. Web `b85c656` has green CI and a successful Vercel production deployment. Mobile `d180073` passes all local gates and refreshes both stale Maestro journey assumptions.

Immediate acceptance: push the mobile/continuity commits once; require green mobile CI and remote Maestro; monitor GitHub's automatic receipt cadence; treat any EAS artifact as build evidence only. Do not submit or publish OTA before device acceptance.

Owner/provider gates: create approved Play/App Store subscription catalogue entries, complete BillDesk merchant/payout verification, validate RevenueCat purchase/restore in sandbox, and perform physical Android acceptance. iOS remains deferred. Notification sending gates stay off.
