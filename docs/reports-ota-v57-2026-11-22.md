# Reports OTA for public Android version 57

This candidate starts at public build source
`4b4ae8e0a5139e3cfb3b61d80d9e4124f6cdb15c`. It remains English-only,
matching that installed interface. The six-language release is separate PR #10
and needs a new native binary. Ari remains free.

## Behavior

Home opens weekly or monthly ledger reviews. Personal suggestions depend on
recorded income, transaction counts, category shares and comparable prior-period
spending. Sparse records do not imply no-spend days or reliable spending trends.
Net cash flow keeps its negative sign and is not described as a bank balance or
actual savings. Private Mode hides report details and the cached coaching card.
Refresh failure keeps the last loaded report with retry.

Weekly/monthly notifications with a valid dated `nudgeId` open that report period.
Legacy or malformed undated notifications retain their coaching-card destination.
The old native ledger does not support report date filters: “Review entries”
opens its existing transaction tab. Navigation 7 uses `pop: true` to return to
existing tabs, preserving the back stack. No new native module is introduced.

## Compatibility and verification

The public AAB is EAS `babe43bf-4a4f-4dc9-aacf-c9e31eb27841`.
Its channel is **internal-release**, despite being the public Play binary.
Its Android runtime is `84cc28590bb0a1fffcf4a346d97bd40e18faac45`.
EAS fingerprint generation against the production environment and original
internal-release profile reproduced this exact hash for both the unmodified
baseline and this candidate. Runtime compatibility was not overridden.

Native dependencies are pinned to the exact installed baseline. JavaScript
navigation was upgraded to remove the vulnerable URL decoder. TypeScript passed;
all 508 tests across 39 suites passed. Android Hermes export passed (2,549 Metro
modules). The source map has 2,510 sources and contains neither xmldom nor the
old query-string/decode-uri-component implementation. The Hermes bundle SHA-256
is `a44026bce6aa92d9f7075ae29b49af162983538ef2874096a3ccda4e1c8ee728`.

The worktree's node_modules junction points to an artifact mirror on D: for disk
space. Fingerprinting/export run from that physical mirror because Expo cannot
reliably fingerprint this cross-drive junction. Changed source files are copied
from this Git worktree; the artifact mirror is not an independent source checkout.
Artifacts are under `D:/Codex/Artifacts/Ari/2026-11-22/`.

## Remaining release gates

The old native fingerprint includes the `@xmldom/xmldom` 0.8.13 config-plugin
toolchain. Updating it changes the native fingerprint. The compatible candidate
retains this known high-severity build-tool advisory; it is absent from the
application bundle. No blanket audit exclusion or forced runtime was added.
The fully patched worldwide native candidate has zero dependency advisories.
The compatible OTA's security gate remains open and is not represented as green.

Production OTA publication and installed version-57 canary acceptance remain
pending. An unreferenced QA branch may hold a review artifact; it must not be
mapped to internal-release without release acceptance. Keep a previous update
or embedded rollback target and check channel/runtime matching and launch health.

Backend GitHub billing still blocks scheduled report generation and readiness.
This OTA's on-demand ledger review does not call an AI provider. It cannot fix
the organization's billing restriction or prove automatic report delivery.
Daily/outbox sending remains disabled.
