/**
 * The wire protocol between this package and the ZOREAL OpenID Provider.
 *
 * VERSIONED: a shipped version keeps working until the provider explicitly
 * refuses it, and when it does, the reason is surfaced verbatim. Both the wire
 * version and the package version travel on every pairing request so a refusal
 * can be precise.
 *
 * Endpoints, all relative to the issuer:
 *
 *   POST /pair                     start a pairing request. Body carries the
 *                                  authorize parameters, the PKCE challenge and
 *                                  `display`: which surface this SDK is about
 *                                  to show, 'qr' or 'link'. It is decided
 *                                  BEFORE the request because the provider
 *                                  binds the pairing to it and enforces the
 *                                  rules below on the claim. Returns
 *                                  { request_id, pair_url, expires_in } or, for
 *                                  prompt=none with a live consented session,
 *                                  { code } immediately.
 *   GET  /pair/:id/status          poll: pending | claimed |
 *                                  approved (with code) | denied | expired |
 *                                  enrolling. Over-polling cancels the request
 *                                  rather than throttling it, so the cadence
 *                                  below is not a suggestion.
 *   GET  /pair/:id/qr.svg          the QR image for the pairing, served by the
 *                                  provider so the pairing surface stays
 *                                  changeable at runtime and this package keeps
 *                                  zero dependencies.
 *
 *                                  For a 'qr' pairing it is not one fixed
 *                                  image: every request renders the CURRENT
 *                                  FRAME of a rolling sequence, sent no-store,
 *                                  and the provider refuses a frame older than
 *                                  half a minute. That is what makes a stolen
 *                                  screenshot worthless: it authenticates a
 *                                  moment, not a request, so only a live relay
 *                                  of the screen could keep up with it. The
 *                                  frame carries a keyed code the provider
 *                                  holds; nothing about it is computed here,
 *                                  and this package only re-fetches the image.
 *
 *                                  For a 'link' pairing there is no QR at all
 *                                  and this endpoint answers 404, so a
 *                                  same-device link cannot be turned into a
 *                                  scannable code through the provider.
 *   POST /token                    the code exchange. Browser-direct mode uses
 *                                  it directly with PKCE and no client secret;
 *                                  auth-code mode leaves it to the RP backend.
 */

export const WIRE_VERSION = 1;
export const SDK_VERSION = '0.1.6';
export const DEFAULT_ISSUER = 'https://id.zoreal.com';

/** Pending TTL is short. Poll gently; over-polling cancels the request. */
export const POLL_INTERVAL_MS = 2000;
/** Enrolling extends the window well beyond a normal login; poll slower. */
export const POLL_INTERVAL_ENROLLING_MS = 5000;
/**
 * How often to re-fetch the QR image when the create response does not say.
 * The provider states the cadence per pairing (qr_refresh_seconds); this is
 * only the fallback, and it is deliberately well inside the age the provider
 * will still accept a frame at.
 */
export const DEFAULT_QR_REFRESH_SECONDS = 3;

/** The pairing surface this SDK will show. Sent on /pair, echoed on the response. */
export type PairDisplay = 'qr' | 'link';

export interface PairCreated {
  request_id: string;
  /**
   * The URL the holder opens (link mode) or the URL a scan resolves to (QR
   * mode). In link mode it carries a start token that binds the claim to the
   * surface the provider handed it to, so it travels verbatim: rebuilding or
   * truncating this string leaves a pairing nothing can claim.
   */
  pair_url: string;
  expires_in: number;
  /**
   * What the provider bound the pairing to. 'legacy' is a pairing started
   * without a `display`, which keeps the old static-code behaviour.
   */
  display?: PairDisplay | 'legacy';
  /** QR mode: how often to re-fetch the image. Absent means DEFAULT_QR_REFRESH_SECONDS. */
  qr_refresh_seconds?: number;
}

export interface PairImmediate {
  /** prompt=none resolved silently: consented sector, live session. */
  code: string;
}

export type PairStartResponse = PairCreated | PairImmediate;

export interface PairStatusResponse {
  /**
   * 'cancelled' is the provider withdrawing the request (an over-polled or
   * abandoned one). It is terminal, like denied and expired.
   */
  status:
    | 'pending'
    | 'claimed'
    | 'approved'
    | 'denied'
    | 'expired'
    | 'enrolling'
    | 'cancelled';
  code?: string;
  expires_in?: number;
  enrolment_deadline?: number;
  /** The provider's reason on denial or refusal. Surfaced verbatim, never rewritten. */
  error?: string;
  error_description?: string;
}

export interface TokenResponse {
  id_token: string;
  access_token?: string;
  token_type?: string;
  expires_in?: number;
  scope?: string;
  error?: string;
  error_description?: string;
}
