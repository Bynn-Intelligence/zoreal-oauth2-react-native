# @zoreal/oauth2-react-native

Login with ZOREAL for React Native: a ZOREAL Verified Proof-of-Human behind
every sign-in, for mobile relying-party apps.

The API mirrors [`@zoreal/oauth2-react`](https://github.com/Bynn-Intelligence/zoreal-oauth2-react)
one to one, so a team shipping both a web app and a native app writes the same
integration twice by renaming imports. Zero native modules and zero runtime
dependencies: everything runs on `fetch` and React Native's `Linking` and
`AppState`.

## Install

```sh
npm install @zoreal/oauth2-react-native
```

`react` (18 or 19) and `react-native` (0.73 or newer) are peer dependencies.

One platform requirement: PKCE needs cryptographic randomness, and stock
Hermes does not provide `crypto.getRandomValues`. If your app does not already
polyfill it, add the standard one:

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

Everything `ZorealOAuthProvider` needs is one value — a `clientId` — and it
comes from a ZOREAL **asset**.

1. Create an account at **https://zoreal.com** and open **Assets**.
2. **Create an asset** — a *website* (a domain you own) or an *app bundle* (a
   reverse-DNS bundle id). An asset is the thing users log in to; its token is
   your `clientId` and it looks like `ast_...`.
3. On the asset, open the **OAuth2** tab and register:
   - the **redirect URIs** and **JavaScript origins** the client uses (requests
     from anything not registered are rejected — this is the core control),
   - the **scopes** the client may request (see the catalogue below),
   - **client authentication** — a client secret for `client_secret_basic`, or a
     JWKS for `private_key_jwt`. That is your **backend's** business; the
     browser-direct flow this SDK runs is a *public client* and authenticates
     with PKCE alone, no secret.
4. A website asset must **verify its domain** (a DNS or meta-tag proof, shown in
   the dashboard) before it can request personal-data scopes or sign users in;
   the verified domain is what your users' pairwise `sub` is derived against.

The `clientId` is public — it ships inside your app, and that is expected. The
client secret is a server-side secret that never comes near this package or the
device.

### There is no test-identity sandbox — and that is deliberate

ZOREAL **never issues fake or sandbox humans**: a pool of test identities would
be a fraud vector against the exact thing the product proves. So you always
authenticate **real** ZOREAL IDs.

To develop and test, **create a free ZOREAL ID for yourself** — enrol in the
ZOREAL ID app — and sign in with it. Mark your asset's environment **sandbox**
in the dashboard while building: a sandbox asset may register `http://localhost`
origins and redirect URIs that a production asset may not. Flip it to production
when you ship. The identities are real either way; only the allowed origins
differ. There is no mock provider and no hosted test issuer to point at.

## How login works on a phone

There is no redirect dance. Starting a login creates a **pairing request**,
and the SDK opens its URL with `Linking.openURL`. That URL is a universal
link: with the ZOREAL ID app installed, the app claims it and the user
approves there; with no app installed, the same URL opens the real pairing
page in the browser, which can enrol a new user.

The ZOREAL app never returns control to your app by redirect. **Your app's
own poll completes the flow**: the SDK keeps polling the pairing request, and
when the user returns to your app (the SDK polls immediately on the
foreground transition), the approval is already waiting. A pairing request
lives 120 seconds before it is claimed and 180 seconds after, so a user who
comes back much later gets a clean `request_expired` in `onNonOAuthError`,
never a hang.

## Two flows: pick by whether you need the user's details

- **You have a backend and want the user's email or name** (most apps): use
  the **auth-code flow**. Your backend gets the email, name, and verification
  details from `/userinfo`. Start here.
- **You have no backend and only need to know "this is a verified, unique
  human, and the same one as last time"**: use the **`<ZorealLoginButton>`**.
  It returns a stable per-user identifier and proof of verification, but no
  email or name. Email and other personal details are never placed in a
  device-side token; that is what the auth-code flow and your backend are for.

## Quick start: auth-code (email and name, needs your backend)

```tsx
import { ZorealOAuthProvider, useZorealLogin } from '@zoreal/oauth2-react-native';

// Wrap your app once:
// <ZorealOAuthProvider clientId="ast_your_asset_id">...</ZorealOAuthProvider>

const login = useZorealLogin({
  flow: 'auth-code',
  scope: 'openid email profile.name',
  onSuccess: async ({ code, code_verifier, nonce }) => {
    // Send ALL THREE to your backend over TLS. Your backend calls POST /token
    // with the code and code_verifier plus its client authentication, verifies
    // the ID token's nonce, then reads the email and name from /userinfo.
    await fetch('https://your-api.example/auth/zoreal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, code_verifier, nonce }),
    });
  },
  onNonOAuthError: (e) => console.warn(e.type, e.description),
});

// <Pressable onPress={login}> or any control you like.
```

The backend half is any library from the family table below.

## Quick start: the button (no backend, pseudonymous)

```tsx
import { ZorealOAuthProvider, ZorealLoginButton } from '@zoreal/oauth2-react-native';

<ZorealOAuthProvider clientId="ast_your_asset_id">
  <ZorealLoginButton
    onSuccess={({ credential }) => {
      // `credential` is an ID token carrying a stable per-user identifier
      // (`sub`) and proof the person is a verified, unique human. No email,
      // no name: use the auth-code flow above for those. Verify it on your
      // server against the JWKS before trusting it.
    }}
    onError={(e) => console.warn(e.type, e.description)}
  />
</ZorealOAuthProvider>
```

The button is a plain `Pressable`: no image assets, no fonts, no UI
dependency, neutral copy ("Continue with ZOREAL" and variants).

## Tablets, TVs, and rendering a QR

On a phone the same-device link is the whole story. Where the approving phone
is a *second* device (a tablet kiosk, a TV), the user scans a QR instead. The
SDK detects `Platform.isPad` / `Platform.isTV`, or you force it with
`display: 'qr'`, and it then does not open any link: it hands you the pairing
URL through `onPairingStateChange` and polling continues as normal.

```tsx
const login = useZorealLogin({
  display: 'qr',
  onPairingStateChange: (s) => {
    // s.pairUrl  -> encode with the QR renderer of your choice
    // s.qrUrl    -> the provider-served SVG of the same URL, if your surface
    //               can show SVG (React Native's <Image> cannot)
    // s.status   -> 'pending' | 'claimed' | 'approved' | ... drive your UI
    // s.cancel() -> wire to your close control
  },
  onSuccess: ...,
});
```

This package deliberately ships no QR renderer: pulling an SVG dependency
into every install to serve the minority surface would be backwards.

## What each export does

| Export | What it is |
|---|---|
| `ZorealOAuthProvider` | Context: `clientId`, optional `issuer` (sandbox), optional `locale` |
| `useZorealLogin(options)` | Returns a `login()` function. `flow: 'auth-code'` hands `{ code, code_verifier, nonce, scope, app_state }` to `onSuccess`; the default browser-direct flow exchanges the code itself (public client, PKCE, no secret) and hands over `{ credential, select_by, acr }` |
| `ZorealLoginButton` | The drop-in `Pressable`, browser-direct flow only |
| `onPairingStateChange` | Every pairing state, plus `pairUrl` / `qrUrl` / `cancel`, for caller-rendered UI |
| `zorealLogout()` | Clears SDK-held local state. Local only: it cannot and does not end the holder's ZOREAL session |
| `hasGrantedAllScopesZoreal` / `hasGrantedAnyScopeZoreal` | Scope checks on a code response |

Errors arrive in two shapes, mirroring the web SDK: `onError` gets OAuth
protocol errors (`{ error, description }`, the provider's reason verbatim);
`onNonOAuthError` gets the human outcomes (`request_denied`,
`request_expired`, `enrolment_abandoned`, `link_failed_to_open`, `unknown`).

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
| `email` | `email`, `email_verified` | `/userinfo` | B | confidential client + verified domain |
| `profile.name` | `name`, `given_name`, `family_name` | `/userinfo` | B | confidential client + verified domain |
| `profile.birthdate` | `birthdate` (full ISO 8601 date) | `/userinfo` | B | confidential client + verified domain |
| `profile.document` | `document_type`, `document_number`, `issuing_country`, `document_expires_on` | `/userinfo` | B | confidential client + verified domain |
| `profile.portrait` | `portrait` (the chip's facial image; GDPR Article 9 data) | `/userinfo` | C | confidential client + verified domain — *registrable but not served yet* |

- **Tier A** rides in the ID token and is available to every client, so the
  no-backend button can use it.
- **Tier B and C** are personal data, served only from `/userinfo` to a
  confidential client on a domain you have verified, and never placed in a
  device-side token — which is why they need the auth-code flow and your
  backend. Tier C (`profile.portrait`) is registrable but the provider does not
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
const login = useZorealLogin({
  flow: 'auth-code',
  acr_values: 'zoreal.live',        // the app now makes the holder pass a face capture
  onSuccess: ({ code, code_verifier, nonce }) => {
    // Post all three to your backend, which verifies the signed acr claim.
  },
});
```

In browser-direct mode the resolved level is on the credential response as
`acr`, parsed from the ID token; the token stays the authority.

### Requesting is not verifying — the rule that matters

`acr_values` here is **advisory**: it shapes what the holder is asked to do, and
proves nothing on its own. The proof is the **signed `acr` claim**, minted by
ZOREAL, verified on your **backend** — the ZOREAL backend libraries
(`zoreal-oauth2` for Ruby and its siblings for Node, Python, PHP, Go, JVM and
.NET) take a required-acr argument at exchange and refuse a token below the
level. A relying party that requests `zoreal.live` but never verifies the claim
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
| `/pair` | `onError` | `invalid_scope` | A scope not on the asset's allow list, or a Tier B scope from a public client |
| `/pair` | `onError` | `invalid_request` | Missing PKCE/nonce, an unverified sector, an unregistered `redirect_uri`, or an unknown `acr_values` |
| `/pair` | `onError` | `login_required` | `prompt: 'none'` with no silent session to resume — the expected quiet outcome, not a failure |
| pairing | `onNonOAuthError` | `request_denied` | The holder declined in their ZOREAL ID app — **not an error to alarm on**; offer to try again |
| pairing | `onNonOAuthError` | `request_expired` | The pairing window elapsed (120s to claim, 180s after), or a required liveness the device could not meet — offer to try again |

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

## A complete example

The auth-code flow, end to end: a control, a pairing dialog, and the hand-off to
your backend. Nothing here verifies the token — that is the backend's job, and
it is not optional.

```tsx
import { useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import {
  ZorealOAuthProvider,
  useZorealLogin,
  type PairingState,
  type NonOAuthError,
} from '@zoreal/oauth2-react-native';

function SignInScreen() {
  const [pairing, setPairing] = useState<PairingState | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const login = useZorealLogin({
    flow: 'auth-code',
    scope: 'openid email profile.name',
    // acr_values: 'zoreal.live',   // add for a step-up / high-value login

    // Show a dialog while the holder approves on their phone; drop it once the
    // pairing is no longer in flight.
    onPairingStateChange: (s) =>
      setPairing(['pending', 'claimed', 'enrolling'].includes(s.status) ? s : null),

    onSuccess: async ({ code, code_verifier, nonce }) => {
      setPairing(null);
      // Hand ALL THREE to YOUR backend over TLS. The backend — never this app —
      // exchanges the code with its client authentication, verifies the ID
      // token (signature against the JWKS, iss, aud, exp, and this nonce), reads
      // any personal claims from /userinfo, and establishes the session.
      // Protect this route with your normal CSRF / same-origin controls: the
      // nonce protects the token, not your endpoint.
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
          ? 'Login was declined. Try again?'
          : e.type === 'request_expired'
            ? 'That took too long. Try again?'
            : (e.description ?? e.type)
      );
    },
  });

  return (
    <View>
      <Pressable onPress={login} accessibilityRole="button">
        <Text>Continue with ZOREAL</Text>
      </Pressable>
      {message && <Text>{message}</Text>}

      <Modal visible={pairing != null} transparent animationType="fade">
        <View /* your dialog styling */>
          <Text>
            {pairing?.status === 'enrolling'
              ? 'Finish setting up your ZOREAL ID, then come back to this app.'
              : 'Approve the login in your ZOREAL ID app.'}
          </Text>
          <Pressable onPress={() => pairing?.cancel?.()}>
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
    <ZorealOAuthProvider clientId="ast_your_asset_id">
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
- **`sub` is pairwise per verified domain.** It is the right account key, and
  it is derived from your registered domain: changing your asset's domain
  rotates every `sub` you have stored. Plan domain changes as a migration.
- **Email is a deliberate choice.** It is gated behind a confidential client
  precisely because a shared email defeats the unlinkability the pairwise
  `sub` provides. Request it because you need it, not because the checkbox is
  familiar.
- **A native app sends no Origin header.** The provider's JavaScript-origin
  allowlist is a browser control: it accepts an origin-less pairing request
  only from a client with NO authorized JavaScript origins registered. A
  native-only client should leave that list empty; an app sharing its client
  with a web frontend should use separate assets. Sandbox clients accept
  localhost origins for web testing; production clients do not.
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

## License

MIT
