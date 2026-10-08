# @zoreal/oauth2-react-native

[![npm](https://img.shields.io/npm/v/@zoreal/oauth2-react-native)](https://www.npmjs.com/package/@zoreal/oauth2-react-native) [![types](https://img.shields.io/npm/types/@zoreal/oauth2-react-native)](https://www.npmjs.com/package/@zoreal/oauth2-react-native) [![CI](https://img.shields.io/github/actions/workflow/status/Bynn-Intelligence/zoreal-oauth2-react-native/ci.yml?branch=main&label=CI)](https://github.com/Bynn-Intelligence/zoreal-oauth2-react-native/actions/workflows/ci.yml) [![OpenSSF Scorecard](https://api.securityscorecards.dev/projects/github.com/Bynn-Intelligence/zoreal-oauth2-react-native/badge)](https://scorecard.dev/viewer/?uri=github.com/Bynn-Intelligence/zoreal-oauth2-react-native) [![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

Login with ZOREAL for React Native: a ZOREAL Verified Proof-of-Human behind
every sign-in, for mobile relying-party apps.

The API mirrors [`@zoreal/oauth2-react`](https://github.com/Bynn-Intelligence/zoreal-oauth2-react)
one to one, so a team shipping both a web app and a native app writes the same
integration twice by renaming imports. It ships the same pieces: the button
with the ZOREAL mark, and a pairing dialog the provider draws for you, in 39
languages. No runtime dependencies: the protocol runs on `fetch` and React
Native's `Linking` and `AppState`, and `react-native-svg`, which most apps
already have, draws the mark and the QR.

## Install

```sh
npm install @zoreal/oauth2-react-native react-native-svg
```

`react` (18 or 19), `react-native` (0.73 or newer) and `react-native-svg` (13
or newer) are peer dependencies. With Expo, `npx expo install react-native-svg`
picks the version your SDK expects.

### Let the app ask whether ZOREAL ID is installed

On a phone the SDK checks for ZOREAL ID before it opens anything (see
[How sign-in works on a phone](#how-sign-in-works-on-a-phone)). Both platforms
answer that question truthfully only for a scheme your app declares, so
declare `zorealid`:

- **iOS**: `zorealid` in `LSApplicationQueriesSchemes` in `Info.plist`. With
  Expo, in `app.json`:

  ```json
  { "expo": { "ios": { "infoPlist": { "LSApplicationQueriesSchemes": ["zorealid"] } } } }
  ```

- **Android 11 and later**: a `<queries>` entry in `AndroidManifest.xml` (with
  Expo, a small config plugin that adds it):

  ```xml
  <queries>
    <intent>
      <action android:name="android.intent.action.VIEW" />
      <data android:scheme="zorealid" />
    </intent>
  </queries>
  ```

The scheme is only asked about, never opened: the sign-in itself always goes
through the https link or the QR. Without the declaration the check says "not
installed" for everyone, and the dialog's "I already have ZOREAL ID" is the
only way past it, so do not skip this.

### Randomness

PKCE needs cryptographic randomness, and stock Hermes does not provide
`crypto.getRandomValues`. If your app does not already polyfill it, add the
standard one:

```sh
npm install react-native-get-random-values
```

```ts
// index.js, first import
import 'react-native-get-random-values';
```

When the source is missing, the login throws a clear error rather than falling
back to weak randomness: a guessable PKCE verifier is a stealable login.

## Getting your credentials

Everything `ZorealOAuthProvider` needs is one value, a `clientId`, and it
comes from a ZOREAL **asset**.

1. Create an account at **https://zoreal.com** and open **Assets**.
2. **Create an asset** of the kind **app**, with your app's bundle identifier
   (reverse-DNS, such as `com.example.app`). An asset is the thing people sign
   in to; its token is your `clientId` and it looks like `ast_...`. Your iOS and
   Android builds share the one asset.
3. On the **Scopes** tab, choose the scopes the client may request (see the
   catalogue below). An app registers **no redirect URIs and no JavaScript
   origins**: the pairing never redirects anywhere, and a native app sends no
   Origin header, so the provider refuses every sign-in from an app client that
   has origins registered.
4. On the **Keys** tab, choose client authentication. Leave the client public
   when the app redeems the code itself (the button). Make it confidential, with
   a client secret (`client_secret_basic`) or a JWKS (`private_key_jwt`), when
   your **backend** does the exchange (the auth-code flow). This package never
   holds a secret.
5. To request personal data (email, name, and the rest of Tier B), **verify the
   app** on the **Verification** tab. Enter the domain your app belongs to, add
   the app to that domain's `.well-known` files (the same files iOS and Android
   use for universal links; the tab shows the exact lines), and press Verify:
   - iOS: `https://<your-domain>/.well-known/apple-app-site-association` lists
     `<Team ID>.<bundle id>` under `applinks` or `webcredentials`.
   - Android: `https://<your-domain>/.well-known/assetlinks.json` lists your
     package name with the SHA-256 fingerprints of its signing keys (the upload
     key and the Play app signing key).

   One platform proven is enough, and the same fetch proves you control the
   domain. With the app verified and the client confidential, the personal-data
   scopes unlock on the Scopes tab. A verified app shows your domain on the
   ZOREAL ID consent screen and shares your website's sector, so a person has
   the same `sub` in your website and your app. Verify before you have users:
   verifying an app that already has users moves them to the domain's sector,
   and every `sub` you stored for them changes. Until then an app's sector is its
   bundle identifier.

The `clientId` is public: it ships inside your app, and that is expected. The
client secret is a server-side secret that never comes near this package or the
device.

### There is no test-identity sandbox, and that is deliberate

ZOREAL **never issues fake or sandbox humans**: a pool of test identities would
be a fraud vector against the exact thing the product proves. So you always
authenticate **real** ZOREAL IDs.

To develop and test, **create a free ZOREAL ID for yourself** (enrol in the
ZOREAL ID app) and sign in with it. Mark your asset's environment **sandbox**
in the dashboard while building and flip it to production when you ship. The
identities are real either way. There is no mock provider and no hosted test
issuer to point at.

## How sign-in works on a phone

There is no redirect. Starting a login creates a **pairing request**, and
ZOREAL ID approves it; your app's own poll picks up the result. With the
provider's dialog on (the default), the SDK checks for ZOREAL ID first and
opens it directly:

- **A phone with ZOREAL ID**: the SDK opens it directly, through a universal
  link (an App Link on Android). The dialog waits with "Open ZOREAL ID again",
  "Use another device" and Cancel.
- **A phone without ZOREAL ID**: the SDK opens nothing. The dialog says ZOREAL
  ID is not on this phone and offers "Get ZOREAL ID" (the App Store or Google
  Play), "Use another device", and "I already have ZOREAL ID".
- **"Use another device"**: the fallback, never the default on a phone. The
  dialog shows the animated QR for ZOREAL ID on another phone, with "Open
  ZOREAL ID on this phone" to switch back.
- **A tablet or TV**: ZOREAL ID ships for phones, so the dialog shows the QR
  from the first tap.

ZOREAL ID does not switch back to your app after the approval; the person
does, and the SDK polls the moment your app returns to the foreground, so the
approval is already waiting. The provider sets the windows, currently five
minutes to claim a pairing and five more once it is claimed, and the SDK
follows the deadline in each answer. Someone who comes back much later gets a
clean `request_expired` in `onNonOAuthError`, never a hang.

## Two flows: pick by who redeems the code

- **Your backend redeems it** (most apps): use the **auth-code flow**. The SDK
  hands your app the code, the PKCE verifier and the nonce; your backend
  exchanges them at `/token` with its client authentication, verifies the ID
  token and opens its own session. Start here.
- **The app redeems it**, and you only need to know "this is a verified, unique
  human, and the same one as last time": use the **`<ZorealLoginButton>`**. It
  returns the ID token, a stable per-user identifier plus proof of
  verification, which your server must still verify before trusting it.

**The person's email or name needs a verified app and your backend.** Those
are Tier B scopes, served only from `/userinfo` to a confidential client of an
asset whose identity is proven: for an app, verified through your domain's
`.well-known` files ([Getting your credentials](#getting-your-credentials), step 5). An
unverified app gets the Tier A claims: the pairwise `sub`, the assurance level
and the assurance block, plus the age thresholds and nationality if you
register them.

## Quick start: the button, with your backend

```tsx
import { ZorealLoginButton, ZorealOAuthProvider } from '@zoreal/oauth2-react-native';

export default function App() {
  return (
    <ZorealOAuthProvider clientId="ast_your_asset_id">
      <ZorealLoginButton
        flow="auth-code"
        onSuccess={async ({ code, code_verifier, nonce }) => {
          // Send ALL THREE to your backend over TLS. Your backend calls POST /token
          // with the code and code_verifier plus its client authentication, and
          // verifies the ID token (signature, iss, aud, exp and this nonce).
          await fetch('https://your-api.example/auth/zoreal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, code_verifier, nonce }),
          });
        }}
        onError={(e) => console.warn(e.type, e.description)}
      />
    </ZorealOAuthProvider>
  );
}
```

That is the whole app side. The button draws the ZOREAL mark and its label,
holds itself busy while a sign-in runs, and the provider draws the dialog: the
check for ZOREAL ID, the store prompt, "Use another device" and the QR. The
backend half is any library from the family table below.

## Quick start: no backend, pseudonymous

```tsx
import { ZorealOAuthProvider, ZorealLoginButton } from '@zoreal/oauth2-react-native';

<ZorealOAuthProvider clientId="ast_your_asset_id">
  <ZorealLoginButton
    onSuccess={({ credential }) => {
      // `credential` is an ID token carrying a stable per-user identifier
      // (`sub`) and proof the person is a verified, unique human. No email,
      // no name. Verify it on your server against the JWKS before trusting it.
    }}
    onError={(e) => console.warn(e.type, e.description)}
  />
</ZorealOAuthProvider>
```

## Your own button, the SDK's dialog

`useZorealLogin` returns the same `login()` the button calls, so any control
can start a sign-in and the provider still draws the dialog. Put the mark on
it with `ZorealMark`:

```tsx
import { Pressable, Text } from 'react-native';
import { ZorealMark, useZorealLogin } from '@zoreal/oauth2-react-native';

function ContinueWithZoreal() {
  const login = useZorealLogin({
    flow: 'auth-code',
    onSuccess: async ({ code, code_verifier, nonce }) => {
      await fetch('https://your-api.example/auth/zoreal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, code_verifier, nonce }),
      });
    },
  });

  return (
    <Pressable onPress={login} accessibilityRole="button" style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <ZorealMark size={22} />
      <Text>Continue with ZOREAL</Text>
    </Pressable>
  );
}
```

## The button

`ZorealLoginButton` takes the same options as `@zoreal/oauth2-react`'s
`ZorealLogin`, with the same pixels:

| Option | Values | Default |
|---|---|---|
| `flow` | `'browser-direct'` (onSuccess gets the ID token) or `'auth-code'` (onSuccess gets code, verifier and nonce) | `'browser-direct'` |
| `theme` | `'outline'` (white), `'filled'` (ZOREAL blue), `'filled_black'` | `'outline'` |
| `size` | `'large'` (50 high, 22 mark), `'medium'` (42, 20), `'small'` (34, 16) | `'large'` |
| `text` | `'continue_with'` (translated), `'signin_with'`, `'signup_with'`, `'signin'`, `'verify_with'` | `'continue_with'` |
| `shape` | `'rectangular'`, `'pill'`, `'square'` | `'rectangular'` |
| `logo_alignment` | `'center'`, `'left'` | `'center'` |
| `type` | `'standard'` (mark and label), `'icon'` (mark only) | `'standard'` |
| `width`, `style`, `click_listener` | a number or percentage, a style merged last, a callback on press | |

Every request option (`scope`, `acr_values`, `display`, `intent`,
`onPairingStateChange` and the rest) works on the button as on the hook. The
copy is neutral: the button asserts nothing about a person who has not yet
authenticated.

## The dialog

The provider draws it for every sign-in unless you opt out. Its props:

| Prop | What it does |
|---|---|
| `locale` | BCP 47. The button label, the dialog and the pairing page follow it. Without it the dialog follows the phone's language. 39 languages ship; anything else reads English. |
| `theme` | `'auto'` (follows the phone), `'light'` or `'dark'`. |
| `pairingUI` | `'modal'` (the default) or `'none'`, which hands the whole UI back to you. |
| `pairingTimeoutMs` | Closes the dialog sooner than the provider's own window. It can shorten the window, never extend it. |

The title follows what the login is for (`intent`, inferred from the scopes
and `acr_values` when you do not set it): a sign-in, an identification when
document attributes are asked for, or a presence check.

## Drawing your own UI

With `pairingUI="none"` the SDK draws nothing and asks nothing: on a phone it
opens the link directly, so the check for ZOREAL ID is yours. Everything you
need is exported: `isZorealIdInstalled()` (resolves `true`, `false`, or `null`
when the platform would not say, and needs the declarations from
[Install](#let-the-app-ask-whether-zoreal-id-is-installed)), `zorealIdStoreUrl()`
for the listing, and `display: 'link'` or `display: 'qr'` to force a way in.
Follow the same rules the dialog does: a phone with ZOREAL ID (or `null`)
opens it, a phone without it is offered the store and never the link, "Use
another device" is the fallback, and a switch between the two is a new login,
since the provider binds each pairing to the way it was started.

### Rendering the QR

```tsx
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SvgUri } from 'react-native-svg';
import { useZorealLogin, type PairingState } from '@zoreal/oauth2-react-native';

function SignInWithCode() {
  const [pairing, setPairing] = useState<PairingState | null>(null);

  const login = useZorealLogin({
    flow: 'auth-code',
    display: 'qr',
    // Every state carries the current frame in qrUrl, a NEW URL every few
    // seconds. Keep the state you were just handed and draw its qrUrl.
    onPairingStateChange: (s) => setPairing(s.status === 'pending' || s.status === 'claimed' ? s : null),
    onSuccess: async ({ code, code_verifier, nonce }) => {
      setPairing(null);
      await fetch('https://your-api.example/auth/zoreal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, code_verifier, nonce }),
      });
    },
    onNonOAuthError: () => setPairing(null),
  });

  // cancel() stops the poll and fires no callback, so clear your state here.
  const cancel = () => {
    pairing?.cancel?.();
    setPairing(null);
  };

  if (!pairing) {
    return (
      <Pressable onPress={login} accessibilityRole="button">
        <Text>Continue with ZOREAL</Text>
      </Pressable>
    );
  }
  return (
    <View>
      {pairing.status === 'pending' && pairing.qrUrl ? (
        <SvgUri uri={pairing.qrUrl} width={240} height={240} accessibilityLabel="Sign-in code for ZOREAL ID" />
      ) : (
        <Text>Approve the sign-in in ZOREAL ID on your phone.</Text>
      )}
      <Pressable onPress={cancel} accessibilityRole="button">
        <Text>Cancel</Text>
      </Pressable>
    </View>
  );
}
```

The code on screen is not a still image. It changes every few seconds, and the
provider refuses a frame that has aged out, so a screenshot forwarded to
somebody else is spent before they can scan it: only the live screen works.
That is also the one thing a QR screen has to get right. Render the `qrUrl` of
the state you were just handed, every time, and never keep showing the first
one, or the code on your screen quietly stops being claimable.
`s.qrRefreshSeconds` tells you the cadence if you want to preload or
cross-fade. A code you generate yourself from `s.pairUrl` carries no frame at
all, and the provider refuses it.

This package still ships no QR renderer: the image comes from the provider, so
a `WebView` or `react-native-svg`'s `SvgUri` pointed at `s.qrUrl` is the whole
QR screen, and pulling a rendering dependency into every install to serve the
minority surface would be backwards.

## What each export does

| Export | What it is |
|---|---|
| `ZorealOAuthProvider` | Context and the dialog host: `clientId`, optional `issuer` (sandbox), `locale`, `theme`, `pairingUI`, `pairingTimeoutMs` |
| `ZorealLoginButton` | The drop-in button, either flow |
| `useZorealLogin(options)` | Returns a `login()` function. `flow: 'auth-code'` hands `{ code, code_verifier, nonce, scope, app_state }` to `onSuccess`; the default browser-direct flow exchanges the code itself (public client, PKCE, no secret) and hands over `{ credential, select_by, acr }` |
| `useZorealAutoLogin(options)` | Silent re-auth (`prompt: 'none'`) for a returning user with a live ZOREAL session; `onUnavailable` is the usual, quiet answer. Never a proof of presence: its `acr` is `zoreal.session` |
| `ZorealMark`, `ZorealLockup`, `ZOREAL_BLUE` | The mark and the full lockup, for your own controls |
| `PairingSheet` | The dialog itself, if you host it somewhere other than the provider |
| `isZorealIdInstalled()`, `zorealIdStoreUrl()` | The check and the store listing, for your own UI |
| `resolveIntent` | How the dialog decides what a login is for |
| `onPairingStateChange` | Every pairing state, plus `pairUrl` / `qrUrl` / `qrRefreshSeconds` / `intent` / `cancel`, for a UI of your own. `qrUrl` is a fresh frame each time; render the current one |
| `zorealLogout()` | Clears SDK-held local state. Local only: it cannot and does not end the holder's ZOREAL session |
| `hasGrantedAllScopesZoreal` / `hasGrantedAnyScopeZoreal` | Scope checks on a code response |

Errors arrive in two shapes, mirroring the web SDK: `onError` gets OAuth
protocol errors (`{ error, description }`, the provider's reason verbatim);
`onNonOAuthError` gets the human outcomes (`request_denied`,
`request_expired`, `enrolment_abandoned`, `link_failed_to_open`, `unknown`).
A person who closes the dialog is not an error: nothing is reported.

## Scopes and claims

Scopes are space-separated in `scope`, always starting with `openid`, and every
one must be pre-authorized on your asset — a request for a scope not on the
allow list is rejected at `/pair`. What each grants, where it is delivered, and
its tier:

| Scope | Claims | Delivered in | Tier | Requires |
|---|---|---|---|---|
| `openid` | `sub`, `iss`, `aud`, `exp`, `iat`, `nonce`, `auth_time`, `acr`, `amr`, and the assurance block | ID token | A | any client |
| `zoreal.age` | `age_over_13/16/18/21/65` booleans — only the thresholds you registered, never an age or birthdate | ID token | A | any client |
| `zoreal.nationality` | `nationality` (ISO 3166-1 alpha-3) | ID token | A | any client |
| `email` | `email`, `email_verified` | `/userinfo` | B | confidential client + verified domain (for an app, verified through it) |
| `profile.name` | `name`, `given_name`, `family_name` | `/userinfo` | B | confidential client + verified domain (for an app, verified through it) |
| `profile.birthdate` | `birthdate` (full ISO 8601 date) | `/userinfo` | B | confidential client + verified domain (for an app, verified through it) |
| `profile.document` | `document_type`, `document_number`, `issuing_country`, `document_expires_on` | `/userinfo` | B | confidential client + verified domain (for an app, verified through it) |
| `profile.portrait` | `portrait` (the chip's facial image; GDPR Article 9 data) | `/userinfo` | C | confidential client + verified domain (for an app, verified through it), *registrable but not served yet* |

- **Tier A** rides in the ID token and is available to every client, so the
  no-backend button can use it.
- **Tier B and C** are personal data, served only from `/userinfo` to a
  confidential client on a domain you have verified, and never placed in a
  device-side token, which is why they need the auth-code flow and a backend.
  For an app asset the proof is its verification through your website's
  domain. Tier C (`profile.portrait`) is registrable but the provider does not
  serve it yet.
- **Age thresholds are a fixed set** — 13, 16, 18, 21, 65 — that you register on
  the asset. A threshold you did not register mints no claim, so its
  `age_over_N` is absent rather than `false` (a backend age check returns `nil`
  for it, not `false`).

## Assurance levels — `acr` and requiring a liveness check

### What `acr` is

`acr` is an OpenID Connect standard claim — *Authentication Context Class
Reference*. It is a string in the ID token that says **how strongly this login
was authenticated**. `sub` tells you *who* (a stable, pairwise identifier for
this person at your site); `acr` tells you *how sure ZOREAL is that the person is
really there for this login*. A stolen, unlocked phone can still produce a `sub`;
it cannot produce a fresh `zoreal.live`.

This SDK is the **request** side of `acr`: you ask for a level, which decides
what the holder's ZOREAL ID app makes them do. Whether it was reached is decided
by the signed token and checked on your backend.

### The three levels

Weakest to strongest. `acr` reports what actually happened, never what was asked.

| `acr` | What the holder did | `amr` | Proves | Does **not** prove |
|---|---|---|---|---|
| `zoreal.session` | Nothing — a returning holder resumed silently from an existing ZOREAL session, no phone interaction | `[]` | Continuity | Presence |
| `zoreal.device` | Approved on their enrolled phone: a secure-element key signature released by a local biometric/passcode unlock | `["hwk","user"]` | Possession of the enrolled device **and** a local unlock | That a live face was captured for *this* login |
| `zoreal.live` | The above **plus** a fresh face capture this login — a flash-plus-zoom video scored for presentation attacks and screen replay, matched 1:1 to the government document read at enrolment | `["hwk","face","user"]` | A live, real, unique human, verified to be the enrolled person, **at the moment of this login** | — (strongest) |

`amr` (*Authentication Methods References*) lists the factors: `hwk` a hardware
key, `user` a presence/unlock gesture, `face` a face biometric. `zoreal.live` is
`zoreal.device` with `face` added. The default is `zoreal.device`. On a phone,
the same-device path means the ZOREAL ID app opens directly; a `zoreal.live`
request runs the face capture inside it before it will approve.

### When to request which

- **`zoreal.device`** (the default): a normal login. Pass no `acr_values`.
- **`zoreal.live`**: a bank onboarding, a high-value transaction, an age-gated
  purchase, a first login, a "confirm it is really you" step.
- **`zoreal.session`** is never *requested*; it is the silent convenience re-auth
  (`prompt: 'none'`) a returning holder gets at a consented site.

### Requesting it here

`acr_values` is a request option on `useZorealLogin` and `<ZorealLoginButton>`,
typed `AcrValue | AcrValue[]` where
`AcrValue = 'zoreal.live' | 'zoreal.device' | 'zoreal.session'`.

```tsx
import { Pressable, Text } from 'react-native';
import { useZorealLogin } from '@zoreal/oauth2-react-native';

function ConfirmItIsYou() {
  const login = useZorealLogin({
    flow: 'auth-code',
    acr_values: 'zoreal.live', // ZOREAL ID now makes the holder pass a face capture
    onSuccess: async ({ code, code_verifier, nonce }) => {
      // Post all three to your backend, which verifies the signed acr claim.
      await fetch('https://your-api.example/auth/zoreal/step-up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, code_verifier, nonce }),
      });
    },
  });

  return (
    <Pressable onPress={login} accessibilityRole="button">
      <Text>Confirm it is you</Text>
    </Pressable>
  );
}
```

In browser-direct mode the resolved level is on the credential response as
`acr`, parsed from the ID token; the token stays the authority.

### Requesting is not verifying — the rule that matters

`acr_values` here is **advisory**: it shapes what the holder is asked to do, and
proves nothing on its own. The proof is the **signed `acr` claim**, minted by
ZOREAL, verified on your **backend** — the ZOREAL backend libraries
(`zoreal-oauth2` for Ruby and its siblings for Node, Python, PHP, Go, JVM,
.NET and Rust) take a required-acr argument at exchange and refuse a token
below the level. A relying party that requests `zoreal.live` but never verifies the claim
has checked nothing.

### `acr` versus the assurance block

`acr` grades *this login event*. The assurance block in the token (uniqueness
basis, verification month, chip-liveness, trust tier, key protection) describes
the *identity behind it*. One is about now; the other about who they are. A
high-value flow wants both.

## The assurance block

`acr` grades the login **event**; the **assurance block** grades the
**identity** behind it. It rides in the ID token as the `zoreal` claim, so your
backend reads it after verifying the token (the ZOREAL backend libraries expose
it, e.g. `login.assurance`), and in browser-direct mode it sits inside the
`credential` you verify server-side. Its keys and their value sets:

| Key | Values | Meaning |
|---|---|---|
| `uniqueness` | `personal_number` \| `document` \| `none` | The anchor the holder is deduplicated on. `personal_number` (a national number from the chip) is strongest; `none` means no reliable anchor |
| `verified_on` | `"YYYY-MM"` | The month the underlying document was verified. Quantised to a month on purpose — a day-precision date is a cross-site correlator |
| `chip_liveness_proven` | `true` \| `false` | Whether the passport chip's active-authentication challenge was proven (a genuine chip, not a clone) |
| `trust_tier` | `high` \| `standard` | `high` when `chip_liveness_proven`, else `standard` |
| `key_protection` | `secure_enclave` \| `strongbox` \| `tee` \| `software` | How the holder's device key is protected. `software` means no hardware attestation |

A high-value flow usually pairs `acr: 'zoreal.live'` (fresh presence, requested
here and verified on the backend) with a check on the assurance block (identity
strength) — e.g. requiring `uniqueness === 'personal_number'` and
`trust_tier === 'high'`.

## Error reference

Failures land in different places depending on the flow. Handle each where it
happens.

### At `/token`

In **auth-code** mode your backend calls `/token`, so these arrive there and its
library rescues them. In **browser-direct** mode this SDK calls `/token` itself
and hands the reason to `onError` verbatim (`{ error, description }`). The
`error` field carries the provider's code as-is:

| Code | Cause | Retryable? |
|---|---|---|
| `invalid_grant` | The code is spent — unknown, expired (60s), already used, PKCE mismatch, or the asset's domain verification lapsed mid-flow | No. Start a **new** login; the code cannot be reused |
| `invalid_request` | Client authentication failed — wrong secret, a bad `private_key_jwt` assertion, or `tls_client_auth` (not accepted at `/token` yet). A confidential-client concern, so you see it on your backend, not in browser-direct mode | No. Fix the client configuration |
| `unsupported_grant_type` | Something other than `authorization_code` reached `/token` | No. A bug |

### In the frontend, before your backend is involved

These come through the SDK callbacks. OAuth protocol errors arrive on `onError`
as `{ error: ErrorCode, description }`; human outcomes arrive on
`onNonOAuthError` as a `NonOAuthError`. (`ZorealLoginButton` funnels both into
its single `onError`, shaped as a `NonOAuthError`.)

| Surface | Callback | Code / type | Meaning |
|---|---|---|---|
| `/pair` | `onError` | `invalid_scope` | A scope not on the asset's allow list, or a Tier B scope from a public client or an app not verified through your domain |
| `/pair` | `onError` | `invalid_request` | Missing PKCE/nonce, an unverified sector, a `redirect_uri` the asset did not register (pass none), JavaScript origins registered on the asset, or an unknown `acr_values` |
| `/pair` | `onError` | `login_required` | `prompt: 'none'` with no silent session to resume — the expected quiet outcome, not a failure |
| pairing | `onNonOAuthError` | `request_denied` | The holder declined in their ZOREAL ID app — **not an error to alarm on**; offer to try again |
| pairing | `onNonOAuthError` | `request_expired` | The pairing window elapsed (the provider's: five minutes to claim, five minutes after), or a required liveness the device could not meet — offer to try again |

The full set of `NonOAuthError.type` this SDK can emit:

| `type` | When |
|---|---|
| `request_denied` | Holder declined in the app. Normal — offer to retry |
| `request_expired` | The window elapsed, or a required liveness could not be met — offer to retry |
| `enrolment_abandoned` | The user began enrolling a new ZOREAL ID and did not finish |
| `link_failed_to_open` | `Linking.openURL` rejected the pairing URL (no handler, or the OS blocked it) |
| `platform_unsupported` | The ZOREAL ID app is not available on this platform yet |
| `unknown` | Anything else; `description` carries the underlying message |

A user who cancels **your** pairing UI is not an error at all: calling
`state.cancel()` aborts the poll locally and fires no callback. Treat
`request_denied` the same way you treat a dismissed dialog — it is a choice, not
a fault. The `ErrorCode` union enumerates the protocol codes the SDK models,
while the provider's code travels verbatim in `error` / `description`, so a
`/token` code such as `invalid_grant` can appear there in browser-direct mode
even though the union centres on the `/pair` codes.

## A complete example with your own UI

The button and the provider's dialog are the whole integration for most apps
(see the quick start). This is the other end: `pairingUI="none"` and every
screen drawn by the app, following the same rules the dialog does. The check
for ZOREAL ID, ZOREAL ID opened directly, the prompt to get it when it is
missing, "Use another device" as the fallback, the QR on a tablet, and the
hand-off to your backend. Nothing here verifies the token. That is the
backend's job, and it is not optional.

It renders the QR with `react-native-svg` (`npm install react-native-svg`).

```tsx
import { useState } from 'react';
import { Linking, Modal, Platform, Pressable, Text, View } from 'react-native';
import { SvgUri } from 'react-native-svg';
import {
  ZorealMark,
  ZorealOAuthProvider,
  isZorealIdInstalled,
  useZorealLogin,
  zorealIdStoreUrl,
  type AuthCodeFlowOptions,
  type NonOAuthError,
  type PairingState,
} from '@zoreal/oauth2-react-native';

const isPad = Platform.OS === 'ios' && Platform.isPad;

function SignInScreen() {
  const [pairing, setPairing] = useState<PairingState | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [hasZorealId, setHasZorealId] = useState<boolean | null>(null);
  const [missing, setMissing] = useState(false);

  // One set of options for both ways in. Only `display` differs.
  const options: AuthCodeFlowOptions = {
    scope: 'openid',
    // acr_values: 'zoreal.live',   // add for a step-up or high-value login

    // Show the dialog while a pairing is in flight; drop it once it is not.
    onPairingStateChange: (s) =>
      setPairing(['pending', 'claimed', 'enrolling'].includes(s.status) ? s : null),

    onSuccess: async ({ code, code_verifier, nonce }) => {
      setPairing(null);
      // Hand ALL THREE to YOUR backend over TLS. The backend, never this app,
      // exchanges the code with its client authentication, verifies the ID
      // token (signature against the JWKS, iss, aud, exp, and this nonce), and
      // establishes the session. Protect this route with your normal CSRF and
      // same-origin controls: the nonce protects the token, not your endpoint.
      const res = await fetch('https://your-api.example/auth/zoreal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ code, code_verifier, nonce }),
      });
      setMessage(res.ok ? 'Signed in.' : 'Sign-in failed.');
    },

    // OAuth protocol errors (from /pair; in auth-code mode the backend owns
    // /token). Render description verbatim, never a friendlier guess.
    onError: (e) => {
      setPairing(null);
      setMessage(`Could not start: ${e.description ?? e.error}`);
    },

    // Human outcomes. request_denied and request_expired are ordinary: offer to
    // try again, do not alarm.
    onNonOAuthError: (e: NonOAuthError) => {
      setPairing(null);
      setMessage(
        e.type === 'request_denied'
          ? 'Sign-in was declined. Try again?'
          : e.type === 'request_expired'
            ? 'That took too long. Try again?'
            : (e.description ?? e.type)
      );
    },
  };

  // ZOREAL ID on this phone, opened directly.
  const signInHere = useZorealLogin({ ...options, flow: 'auth-code', display: 'link' });
  // ZOREAL ID on another device, through the QR.
  const signInWithCode = useZorealLogin({ ...options, flow: 'auth-code', display: 'qr' });

  const start = async () => {
    setMessage(null);
    // A tablet has no ZOREAL ID of its own: the QR is its way in.
    if (isPad) return signInWithCode();
    // Needs the zorealid query declared (see Install), or it answers false.
    const installed = await isZorealIdInstalled();
    setHasZorealId(installed);
    // Only a firm "no" stops here, and then nothing is opened or started.
    if (installed === false) return setMissing(true);
    signInHere();
  };

  // cancel() stops the poll and fires no callback, so close the dialog here.
  const cancel = () => {
    pairing?.cancel?.();
    setPairing(null);
  };

  // Each pairing is bound to its way, so a switch is a new sign-in.
  const switchTo = (next: () => void) => {
    cancel();
    next();
  };

  const showingCode = pairing?.qrUrl != null && pairing.status === 'pending';

  return (
    <View>
      <Pressable onPress={start} accessibilityRole="button" style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <ZorealMark size={22} />
        <Text>Continue with ZOREAL</Text>
      </Pressable>
      {message && <Text>{message}</Text>}

      {/* ZOREAL ID is not on this phone: the store, or the fallback. */}
      <Modal visible={missing} transparent animationType="fade" onRequestClose={() => setMissing(false)}>
        <View /* your dialog styling */>
          <Text>
            ZOREAL ID is not on this phone. Get it, set it up, and try again, or use
            ZOREAL ID on another phone.
          </Text>
          <Pressable onPress={() => Linking.openURL(zorealIdStoreUrl())} accessibilityRole="button">
            <Text>Get ZOREAL ID</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              setMissing(false);
              signInWithCode();
            }}
            accessibilityRole="button">
            <Text>Use another device</Text>
          </Pressable>
          <Pressable onPress={() => setMissing(false)} accessibilityRole="button">
            <Text>Cancel</Text>
          </Pressable>
        </View>
      </Modal>

      <Modal visible={pairing != null} transparent animationType="fade" onRequestClose={cancel}>
        <View /* your dialog styling */>
          {showingCode ? (
            <>
              <Text>Scan this code with ZOREAL ID on your phone.</Text>
              {/* A new qrUrl arrives every few seconds. Always draw the current one. */}
              <SvgUri uri={pairing.qrUrl!} width={240} height={240} accessibilityLabel="Sign-in code for ZOREAL ID" />
              {!isPad && hasZorealId !== false && (
                <Pressable onPress={() => switchTo(signInHere)} accessibilityRole="button">
                  <Text>Open ZOREAL ID on this phone</Text>
                </Pressable>
              )}
            </>
          ) : (
            <>
              <Text>
                {pairing?.status === 'enrolling'
                  ? 'Finish setting up ZOREAL ID, then come back to this app.'
                  : pairing?.appLink
                    ? 'Approve the sign-in in ZOREAL ID, then come back to this app.'
                    : 'Approve the sign-in in ZOREAL ID on your phone.'}
              </Text>
              {pairing?.appLink && pairing.status === 'pending' && (
                <Pressable onPress={() => switchTo(signInWithCode)} accessibilityRole="button">
                  <Text>Use another device</Text>
                </Pressable>
              )}
            </>
          )}
          <Pressable onPress={cancel} accessibilityRole="button">
            <Text>Cancel</Text>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}

// Mount the provider once, above anything that logs in:
export default function App() {
  return (
    <ZorealOAuthProvider clientId="ast_your_asset_id" pairingUI="none">
      <SignInScreen />
    </ZorealOAuthProvider>
  );
}
```

## Security

- **Always pass the nonce through, and protect your own endpoint too.** The SDK
  generates the nonce and hands it to `onSuccess`; your backend passes it to its
  verify step to confirm the ID token was minted for *this* login rather than
  substituted. Two things the nonce does **not** do: it is not your login
  endpoint's CSRF token — protect that route with your framework's normal CSRF /
  same-origin defence, exactly as you would any login POST — and it is not what
  binds the exchange. **PKCE** is: the `code_verifier` this SDK generates and
  hands over proves whoever redeems the code is whoever started the flow. Without
  it, a stolen code is a stolen login.
- **The issuer must match the token's `iss` exactly** — compared, not
  normalized. Production is `https://id.zoreal.com`, and your backend makes this
  comparison when it verifies. Set the SDK's `issuer` to anything other than the
  default only for a non-production endpoint you were given.
- **Verification is the backend's, always.** This SDK reads `acr` out of the
  token for convenience but verifies nothing — a signature check on an
  attacker-controlled device proves nothing. The signed ID token is
  authoritative only after your backend checks it against `{issuer}/jwks`
  (ES256).

## Things worth knowing before you integrate

- **The ID token never carries personal data.** `sub`, timing, `acr`/`amr`,
  the assurance block, and — if registered — `age_over_*` booleans and
  `nationality`. Email, names, birthdate and document fields come only from
  `/userinfo`, on your backend.
- **The access token lives 10 minutes.** Your backend should read `/userinfo`
  while handling the login, not store the token for later.
- **`sub` is pairwise per sector.** It is the right account key. An app
  verified through your domain shares that domain's sector, so the same person
  has the same `sub` in your website and your app; an unverified app's sector
  is its bundle identifier. Changing either (the domain, the bundle identifier,
  or verifying an app that already has users) changes every `sub` you have
  stored, so plan it as a migration.
- **Email is a deliberate choice.** It is gated behind a confidential client
  precisely because a shared email defeats the unlinkability the pairwise
  `sub` provides. Request it because you need it, not because the checkbox is
  familiar.
- **Register no JavaScript origins and no redirect URIs on an app asset.** A
  native app sends no Origin header, and the provider accepts an origin-less
  pairing request only from a client with NO authorized JavaScript origins
  registered, so a single origin blocks every sign-in from the app. The pairing
  never redirects, and a `redirect_uri` you pass must be registered or `/pair`
  refuses it, so leave `redirect_uri` unset. A website that also signs people
  in uses its own website asset.
- **Client authentication never lives in this package.** The browser-direct
  flow is a public client: PKCE is its only proof, and no secret exists. The
  confidential methods (`client_secret_basic`, `private_key_jwt`, mTLS)
  belong to your backend and its library below. A pull request adding a
  `clientSecret` prop here is a security bug regardless of its documentation.
- **The poll cadence is fixed** (2 seconds; 5 while enrolling). The provider
  cancels an over-polling request rather than throttling it, so the SDK never
  retries faster on error, and neither should anything you build around it.
- **Server errors are shown, not rewritten.** Whatever reason the provider
  gives, `description` carries it verbatim.

## Verifying this release

Every version is published from GitHub Actions with [npm provenance](https://docs.npmjs.com/generating-provenance-statements): the package page on npmjs.com carries a **Provenance** panel linking the exact commit and workflow run that built the tarball, signed through [Sigstore](https://www.sigstore.dev/) and recorded in its public transparency log. No long-lived npm token stands behind it — the workflow authenticates by OIDC ([trusted publishing](https://docs.npmjs.com/trusted-publishers)), so a leaked CI secret cannot cut a release.

Check the signatures on what you actually installed:

```sh
npm install @zoreal/oauth2-react-native
npm audit signatures
```

## The ZOREAL OAuth2 library family

| Repository | Package | Role |
|---|---|---|
| zoreal-oauth2-react | @zoreal/oauth2-react (npm) | React frontend: the button, the QR, the polling |
| zoreal-oauth2-js | @zoreal/oauth2-js (npm) | Framework-free browser core |
| zoreal-oauth2-react-native | @zoreal/oauth2-react-native (npm) | React Native frontend |
| zoreal-oauth2-node | @zoreal/oauth2-node (npm) | Node.js backend |
| zoreal-oauth2-ruby | zoreal-oauth2 (RubyGems) | Ruby backend |
| zoreal-oauth2-python | zoreal-oauth2 (PyPI) | Python backend |
| zoreal-oauth2-php | zoreal/oauth2 (Packagist) | PHP backend |
| zoreal-oauth2-go | github.com/Bynn-Intelligence/zoreal-oauth2-go | Go backend |
| zoreal-oauth2-java | com.zoreal:oauth2 (Maven Central) | JVM backend |
| zoreal-oauth2-dotnet | Zoreal.OAuth2 (NuGet) | .NET backend |
| zoreal-oauth2-rust | zoreal-oauth2 (crates.io) | Rust backend |

## License

MIT
