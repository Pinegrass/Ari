# Legacy measurement retention boundary — 15 September 2026

Backend source4d39f87551064310e978eb8f88c93be3e6f8d5ce, local/unpublished. Cleanup previously deleted dates strictly older than UTCtoday−90, keeping the boundary date and allowing nearly91days of retained daily counts. It now removes that date inclusively and normalizes any supplied aware clock to UTC. Naive test/operation clocks are rejected before mutation.

Legacy rows have only a UTC date, so cleanup conservatively drops the whole boundary day. This can delete later events from that day slightly early; it avoids assuming nonexistent per-event timestamps. Newer89-day/current rows remain. Dedupe ledger and notification rules unchanged. No schema change, live cleanup or deployment performed.

Four new fixtures cover UTC midnight/end-of-day, an offset clock crossing local midnight, repeat cleanup, retained dates and naive-clock rejection. Full backend340tests pass, scoped RuffF/E9 and diff check pass. Existing production callers use no supplied clock and therefore obtain aware UTC now.

This fixes selection at execution time, not scheduler availability or exact continuous enforcement. A delayed/missing daily job can still postpone physical deletion. S3 monitoring and S6 timestamped v2 retention/export remain open. Do not claim this alone establishes end-to-end90-day compliance. Existing consent withdrawal cleanup is unchanged.
