/**
 * The public types of @zoreal/oauth2-react-native.
 *
 * The API mirrors @zoreal/oauth2-react (which itself mirrors
 * @react-oauth/google), so a team moving between the web and native SDKs
 * ports by renaming imports. The one taxonomy difference is honest to the
 * platform: a native app has no popup to fail, so the popup error types are
 * replaced by the single launch failure a native app can have.
 */

export type ErrorCode =
  | 'invalid_request'
  | 'access_denied'
  | 'unauthorized_client'
  | 'unsupported_response_type'
  | 'invalid_scope'
  | 'server_error'
  | 'temporarily_unavailable'
  // The OIDC interaction errors. prompt=none answers with these when no
  // silent session exists, which is a quiet outcome, not a failure.
  | 'login_required'
  | 'consent_required'
  | 'interaction_required';

/** Failures that are not OAuth errors, because the flow never reached the provider. */
export type NonOAuthError = {
  type:
    | 'link_failed_to_open' // Linking.openURL rejected the pairing URL
    | 'request_expired' // the pairing request timed out before approval
    | 'request_denied' // the holder declined in the app
    | 'enrolment_abandoned' // the user started enrolling and did not finish
    | 'platform_unsupported' // the ZOREAL ID app is not available on this platform yet
    | 'unknown';
  /** The provider's own reason string. Render it. Never substitute a friendlier guess. */
  description?: string;
};

/** How the holder reached this login. */
export type SelectBy = 'qr' | 'app_link' | 'device' | 'session';

/**
 * How the login was actually authenticated. Describes what happened, never
 * what was requested: 'zoreal.live' means a fresh liveness capture was passed
 * for this login. As acr_values it is a request; only the signed acr claim in
 * the ID token confirms it, so verify that claim on your backend.
 */
export type AcrValue = 'zoreal.live' | 'zoreal.device' | 'zoreal.session';

export interface PairingState {
  status: 'pending' | 'claimed' | 'approved' | 'denied' | 'expired' | 'enrolling' | 'cancelled';
  /** Present while status is 'pending' or 'claimed'. Seconds. */
  expiresIn?: number;
  /** Present while status is 'enrolling'. Enrolment extends the window well beyond a normal login. */
  enrolmentDeadline?: number;
  /**
   * The pairing link. On a phone the SDK opens it itself, and it carries a
   * start token that ties the claim to this login, so pass it around
   * unmodified. In QR mode it is the address behind the code rather than
   * something to draw: a QR you generate from this string is a code with no
   * frame, which the provider refuses. Show qrUrl instead.
   * Present on every callback of a pairing flow.
   */
  pairUrl?: string;
  /**
   * The QR image to show, served by the provider as an SVG.
   *
   * IT CHANGES. In QR mode this is one frame of a rolling code: a new URL
   * arrives with every state, roughly every qrRefreshSeconds, and the
   * provider stops accepting a frame that has aged out. Render the qrUrl of
   * the state you are given, every time; caching the first one leaves a code
   * on screen that quietly stops working within the minute. That is the point
   * of the design: a screenshot of the code is worth nothing to someone who
   * receives it seconds later.
   *
   * React Native's Image does not decode SVG, so point an SVG-capable
   * renderer at this URL (react-native-svg's SvgUri, or a WebView).
   *
   * Absent in app-link mode, where the provider serves no QR at all.
   */
  qrUrl?: string;
  /** QR mode: how often qrUrl changes, in seconds. Useful for a preload or a fade. */
  qrRefreshSeconds?: number;
  /** True when the flow opened the app link (same device) rather than showing a QR. */
  appLink?: boolean;
  /** Abandons this pairing: stops the poll. Wire it to your UI's cancel control. */
  cancel?: () => void;
}

export interface ZorealLoginRequestOptions {
  /** Defaults to 'openid'. Scopes that return personal data require flow: 'auth-code'. */
  scope?: string;
  /**
   * Ask for a specific assurance. 'zoreal.live' requires a fresh liveness
   * capture in the ZOREAL ID app before the login can complete. Advisory:
   * your backend must verify the signed acr claim in the ID token. Omit to
   * accept the default, zoreal.device.
   */
  acr_values?: AcrValue | AcrValue[];
  /** Seconds. Forces re-authentication when auth_time is older. */
  max_age?: number;
  prompt?: 'none' | 'login' | 'consent';
  /** Echoed back. Not a CSRF token: the SDK generates its own state and PKCE verifier. */
  app_state?: string;
  /**
   * 'auto' opens the app link on a phone and exposes the QR surface on a
   * tablet or TV. 'link' forces the app link; 'qr' forces the QR surface and
   * leaves rendering it to you, via onPairingStateChange.
   *
   * The resolved answer is sent when the pairing is created and the provider
   * binds the pairing to it: a QR pairing is claimable only from a live frame
   * of its own code, an app-link pairing only from the link it handed back.
   * Forcing the surface your screen does not actually show is therefore a
   * login that cannot be completed, not a cosmetic mismatch.
   */
  display?: 'auto' | 'qr' | 'link';
  /** Called on each pairing state change. Drive your own UI from this if you render one. */
  onPairingStateChange?: (state: PairingState) => void;
}

export interface ZorealButtonConfiguration {
  type?: 'standard' | 'icon';
  theme?: 'outline' | 'filled' | 'filled_black';
  size?: 'large' | 'medium' | 'small';
  /**
   * All four are neutral. The button asserts nothing about a person who has not yet
   * authenticated; there is no 'verified_human' variant.
   */
  text?: 'continue_with' | 'signin_with' | 'signup_with' | 'signin';
  shape?: 'rectangular' | 'pill' | 'square';
  logo_alignment?: 'left' | 'center';
  width?: number | `${number}%`;
  click_listener?: () => void;
}

export interface ZorealCredentialResponse {
  /** The ID token. Verify it server-side against the JWKS before trusting it. */
  credential: string;
  clientId: string;
  select_by: SelectBy;
  /** Convenience, parsed from the token. The token stays the authority. */
  acr: AcrValue;
}

export interface ZorealCodeResponse {
  code: string;
  scope: string;
  app_state?: string;
  /**
   * The PKCE verifier for this code. Post it to your backend with the code;
   * the backend sends both to /token along with its client authentication.
   * PKCE is mandatory for every client, and the verifier is generated here, so
   * your server can only complete the exchange if this hands it over. It travels
   * to YOUR backend over TLS and nowhere else.
   */
  code_verifier: string;
  /**
   * The nonce the SDK generated for this flow. The ID token carries it, and
   * without handing it over the backend doing the exchange has no way to check
   * the token it receives was minted for this login rather than substituted.
   * Verify it against the ID token's nonce claim, alongside iss, aud and exp.
   * Same travel rule as code_verifier.
   */
  nonce: string;
}

export interface BrowserDirectFlowOptions extends ZorealLoginRequestOptions {
  onSuccess?: (response: ZorealCredentialResponse) => void;
  onError?: (error: Pick<NonOAuthError, 'description'> & { error: ErrorCode }) => void;
  onNonOAuthError?: (error: NonOAuthError) => void;
}

export interface AuthCodeFlowOptions extends ZorealLoginRequestOptions {
  onSuccess?: (response: ZorealCodeResponse) => void;
  onError?: (error: Pick<NonOAuthError, 'description'> & { error: ErrorCode }) => void;
  onNonOAuthError?: (error: NonOAuthError) => void;
  /** Must be registered for this client in the ZOREAL dashboard. */
  redirect_uri?: string;
}
