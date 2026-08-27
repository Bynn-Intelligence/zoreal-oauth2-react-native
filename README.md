# @zoreal/oauth2-react-native

Login with ZOREAL for React Native: a ZOREAL Verified Proof-of-Human behind
every sign-in, for mobile relying-party apps.

The API mirrors [`@zoreal/oauth2-react`](https://github.com/Bynn-Intelligence/zoreal-oauth2-react)
one to one, so a team shipping both a web app and a native app writes the same
integration twice by renaming imports. Zero native modules and zero runtime
dependencies: everything runs on `fetch` and React Native's `Linking` and
`AppState`.

## Status

Early release. The package implements wire protocol v1. The hosted ZOREAL
login service is still rolling out, so treat this as a preview: the API is
stable, but end-to-end sign-in against production is not available everywhere
yet. This note is removed once the service is generally available.

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

## Scopes

Space-separated in `scope`, always starting with `openid`:

| Scope | Returns | Delivered in | Needs |
|---|---|---|---|
| `openid` | `sub` (stable per-user id) and a proof-of-human summary | ID token | nothing |
| `zoreal.age` | `age_over_N` booleans for registered thresholds, never an age | ID token | nothing |
| `zoreal.nationality` | `nationality` (ISO 3166-1 alpha-3) | ID token | nothing |
| `email` | `email`, `email_verified` | `/userinfo` | verified domain, confidential client |
| `profile.name` | `name`, `given_name`, `family_name` | `/userinfo` | verified domain, confidential client |
| `profile.birthdate` | `birthdate` (full date) | `/userinfo` | verified domain, confidential client |
| `profile.document` | `document_type`, `document_number`, `issuing_country`, `document_expires_on` | `/userinfo` | verified domain, confidential client |
| `profile.portrait` | `portrait`, the person's verified identity photo | `/userinfo` | verified domain, confidential client |

The first three ride in the ID token and are available to any client, so the
no-backend button can use them. Everything else is personal data: served only
from `/userinfo` to a confidential client, which means the auth-code flow and
your backend.

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
- **ES256 only.** The provider signs with nothing else. This SDK never
  verifies tokens — a check on an attacker-controlled device proves nothing —
  so verification belongs on your backend, against `{issuer}/jwks`.
- **Always pass the nonce through.** The SDK generates it and hands it to
  `onSuccess`; without it your backend cannot tell a substituted ID token
  from the real one.
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

## Development against a local provider

Point `issuer` at your provider instance. The issuer value must match the
`iss` inside the tokens exactly — it is compared, not normalized.

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
