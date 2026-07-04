# SSL Certificate Pinning — Runbook

**Owner:** Ari mobile • **Introduced:** Sprint 4 / v1.1.0 (2026-07-04) • **Code:** `src/lib/sslPinning.ts`, wired in `App.tsx`.

Ari pins the TLS public keys (SPKI) of its two backend hosts so a fraudulent
certificate (corporate MITM proxy, compromised CA, rogue Wi-Fi) cannot silently
intercept API or auth traffic. This is the **highest-risk change in v1.1.0**:
a wrong pin set can brick networking for every install until a fix ships.
Everything below is designed around that failure mode.

---

## 1. What is pinned

Library: [`react-native-ssl-public-key-pinning`](https://github.com/frw/react-native-ssl-public-key-pinning) `1.2.6`
(SPKI pinning over OkHttp `CertificatePinner` on Android / TrustKit on iOS,
autolinked — **no Expo config-plugin entry**, activates on any dev/prod build).

| Domain | Host | What we pin |
|--------|------|-------------|
| Railway API | `web-production-7c65f.up.railway.app` | LE **YE1** intermediate + **ISRG Root YE** + **ISRG Root X2** |
| Supabase | `cazigdaoqeoqnqwajibf.supabase.co` | GTS **WE1** intermediate + **GTS Root R4** + **GTS Root R1** |

**We pin the issuing intermediate + two long-lived CA roots — never the leaf.**
Let's Encrypt and Google Trust Services rotate leaf certs every ~60–90 days; a
leaf pin would fail on every rotation. Roots/intermediates move on a multi-year
horizon, and each domain carries ≥2 backup pins so a single CA rotation can't
lock anyone out.

`u.expo.dev` (the OTA update CDN) is **deliberately not pinned** — this is what
makes the kill switch below actually work when pinning breaks.

### Current pins (SPKI SHA-256, base64) — derived 2026-07-04

```
# Railway  web-production-7c65f.up.railway.app
brzvtCELCIZUo4sD/qPX0ccRtPsd3DY6RfmxpOU9oB4=   # Let's Encrypt YE1 (intermediate, current issuer)
sCkq5UWXjg+7mKu9lMhhYF5bGLsy7VI/UNW3tccdR7w=   # ISRG Root YE (backup)
diGVwiVYbubAI3RW4hB9xU8e/CH2GnkuvVFZE8zmgzI=   # ISRG Root X2 (long-lived anchor backup)

# Supabase  cazigdaoqeoqnqwajibf.supabase.co
kIdp6NNEd8wsugYyyIYFsi1ylMCED3hZbSR8ZFsa/A4=   # GTS WE1 (intermediate, current issuer)
mEflZT5enoR1FuXLgYYGqnVEoZvmf9c2bVBpiOjYQ0c=   # GTS Root R4 (backup)
hxqRlPTu1bMS/0DITB1SSu0vd4u/8l8TjPgfaAp63Gc=   # GTS Root R1 (backup)
```

Backstop `expirationDate`: **2027-10-01** (`SSL_PINNING_EXPIRATION`). After this
date the library stops enforcing pins even on an install that never updated —
prevents a permanent brick from an unforeseen CA migration. **Bump it on every
native release.**

---

## 2. How the pins were derived

Any engineer can reproduce these. All you need is `openssl`.

```bash
# 1. Dump the served chain and split into per-cert PEMs
HOST=web-production-7c65f.up.railway.app
openssl s_client -showcerts -servername "$HOST" -connect "$HOST:443" </dev/null 2>/dev/null \
  | csplit -s -z -f cert_ -b '%02d.pem' - '/-----BEGIN CERTIFICATE-----/' '{*}'

# 2. Compute the SPKI SHA-256 pin for a cert
spki() { openssl x509 -in "$1" -pubkey -noout \
  | openssl pkey -pubin -outform der \
  | openssl dgst -sha256 -binary | openssl enc -base64; }

for f in cert_*.pem; do
  echo "$(openssl x509 -in "$f" -noout -subject)  ->  sha256/$(spki "$f")"
done
```

Pick the **intermediate** (the cert whose subject is the CA that issued the
leaf) and the **root(s)**. Ignore `cert_00`/the leaf (`CN=*.up.railway.app` /
`CN=supabase.co`).

**Cross-check (do this for any root pin):** the Google roots were verified
against Google's published repo — `curl https://pki.goog/repo/certs/gtsr4.pem`
piped through `spki()` produced the *identical* `mEfl…` hash we pulled from the
live Supabase chain. That end-to-end match is your confidence that the
derivation is correct. For Let's Encrypt/ISRG roots the equivalent source is
<https://letsencrypt.org/certificates/>.

---

## 3. Kill switch (MANDATORY escape hatch)

Pinning is gated by two things, both in the JS bundle (so both are
**OTA-updatable with no native rebuild**):

1. `SSL_PINNING_ENABLED` (`src/lib/sslPinning.ts`) — the master switch.
2. `PIN_SETS` — the pins themselves.

### To disable pinning fleet-wide (the "we broke it" button)

```ts
// src/lib/sslPinning.ts
export const SSL_PINNING_ENABLED = false;
```
```bash
# v1.1.0 fleet (fingerprint runtimeVersion):
npx eas update --branch preview   --environment preview --message "KILL: disable SSL pinning"
# also production channel when it's the live one:
npx eas update --branch production --environment production --message "KILL: disable SSL pinning"
```
> `--environment` is **mandatory** on every publish or the PostHog key drops out
> of the bundle (local `.env` has it commented). State which fleet you target —
> the v1.0.1 fleet needs the temp-pin OTA procedure (see `docs/ota-strategy.md`).

**Why this works even when pinning has bricked all API/auth traffic:** OTA
bundles are fetched from `u.expo.dev`, which is not pinned. The app can always
pull the kill-switch update. Users get it on next launch / foreground.

### To rotate pins instead of disabling

Edit `PIN_SETS`, keep `SSL_PINNING_ENABLED = true`, publish the same way. Always
publish the **new** pin *before* the CA switches (add-then-remove), so both old
and new chains validate during the transition.

### Optional stronger switch (not shipped in v1.1.0)

A remote-config disable via an *unauthenticated* backend endpoint (e.g.
`GET /api/config/client → {ssl_pinning_enabled}`) read **before** init would let
Ops disable pinning without republishing a bundle. Not needed for v1.1.0 because
the OTA CDN is unpinned and the OTA switch is already robust; noted here as the
Phase-2 upgrade. If added, the config fetch must run *before* `initSslPinning()`
and its host must not be pinned.

---

## 4. Failure modes & fail-open policy

| Situation | Behaviour | Why |
|-----------|-----------|-----|
| Kill switch off (`SSL_PINNING_ENABLED=false`) | No pinning, all traffic flows | `resolvePinningDecision → 'disabled_by_flag'` |
| Native module absent (Expo Go, misbuild) | **Fail OPEN** — unpinned, breadcrumb logged | `isSslPinningAvailable()===false → 'unavailable'` |
| `initializeSslPinning()` throws | **Fail OPEN** — `captureError` to Sentry, app continues | init is wrapped; a pinning bug must never crash startup |
| Runtime pin **mismatch** (real MITM or wrong pin) | That connection **fails closed**, but is **reported** to Sentry + analytics | correct security posture; never *silent* — the error listener fires `ssl_pin_validation_failed` |
| Past `expirationDate` | Pinning stops enforcing | stale-install brick backstop |

Design rule, per sprint mandate: **init/availability failures fail OPEN with
Sentry reporting; a genuine cert mismatch fails that request closed but is never
silent.** The one thing we never do is silently fail closed.

---

## 5. What an outage looks like in Sentry

- Event: `Error: SSL pin validation failed for <host>`, tag `area=ssl_pinning`,
  tag `host=<host>`. Analytics event `ssl_pin_validation_failed`.
- A **spike across many users/devices at once** ⇒ a CA rotated to an unpinned
  chain (our bug) → **flip the kill switch** (§3) and rotate pins.
- A **handful of users on the same network/proxy** ⇒ a real MITM / corporate
  proxy → *not* our bug; do **not** disable pinning. Pinning is doing its job.
- `initializeSslPinning failed` events without mismatch ⇒ native/init problem;
  fail-open means users are unpinned but working — fix in the next build.

**Triage first question:** is it broad (our rotation) or narrow (their network)?
Broad → kill switch. Narrow → leave it.

---

## 6. Verifying the failure mode deliberately

Unit level (runs in CI, `src/lib/__tests__/sslPinning.test.ts`):
- pin-set shape (≥3 pins/host, valid base64 SPKI, expiration set);
- kill-switch + availability branching;
- init fails open + reports on throw;
- **a simulated runtime mismatch reports the host to Sentry** (the "loud, never
  silent" guarantee).

On-device (requires a native build — do this before every release that touches
pins). ⚠️ *Device/build-gated — not runnable from the agent environment:*
1. **Positive:** install the preview APK with the real pins → log in, add a
   transaction, open Tomo. All network works. ✅
2. **Negative:** build a throwaway APK with one character of every Railway pin
   corrupted (or `SSL_PINNING_ENABLED=true` + garbage pins) → API/auth calls
   fail, and a `ssl_pin_validation_failed` event lands in Sentry within seconds.
   This proves the enforcement path *and* the reporting path. ✅
3. **Kill switch:** from the bricked state of step 2, publish an OTA with
   `SSL_PINNING_ENABLED=false` → relaunch → networking restored without a
   rebuild. Proves the escape hatch. ✅

Keep the negative-test APK out of any distribution channel.

---

## 7. Rotation checklist (when a CA changes)

1. Re-run §2 against both hosts; diff pins against `PIN_SETS`.
2. If the served intermediate changed, **add** the new pin (keep the old) and
   publish an OTA — both validate during the CA's transition window.
3. After the CA fully cuts over and Sentry is quiet, remove the retired pin in
   the next release.
4. Bump `SSL_PINNING_EXPIRATION` on every native build.
5. Update the pin table in §1 and the derivation date.
