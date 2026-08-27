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

/** How the login was actually authenticated. Describes what happened, never what was requested. */
export type AcrValue = 'zoreal.live' | 'zoreal.device' | 'zoreal.session';

export interface PairingState {
  status: 'pending' | 'claimed' | 'approved' | 'denied' | 'expired' | 'enrolling' | 'cancelled';
  /** Present while status is 'pending' or 'claimed'. Seconds. */
  expiresIn?: number;
  /** Present while status is 'enrolling'. Enrolment extends the window well beyond a normal login. */
  enrolmentDeadline?: number;
  /**
   * The pairing link. On a phone the SDK opens it itself; where a QR belongs
   * (a tablet, a shared display, display: 'qr'), render this with the QR
   * library of your choice. Present on every callback of a pairing flow.
   */
  pairUrl?: string;
  /**
   * The provider-served SVG image of pairUrl, for surfaces that can show an
   * SVG (a WebView, or a web embed). React Native's Image cannot render SVG:
   * on a native screen, draw pairUrl with your own QR renderer instead.
   */
  qrUrl?: string;
  /** True when the flow opened the app link (same device) rather than showing a QR. */
  appLink?: boolean;
  /** Abandons this pairing: stops the poll. Wire it to your UI's cancel control. */
  cancel?: () => void;
}

export interface ZorealLoginRequestOptions {
  /** Defaults to 'openid'. Scopes that return personal data require flow: 'auth-code'. */
  scope?: string;
  /** Ask for a specific assurance. Omit to accept the default, zoreal.device. */
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
