/**
 * The pairing channel, client side. wire.ts pins the endpoints.
 *
 * On a phone the pairing is SAME-DEVICE: the SDK opens the pairing URL (the
 * ZOREAL ID app claims it as a universal link; with no app installed the same
 * URL is the real pairing page in the browser), and this app keeps polling.
 * The ZOREAL app never returns control by redirect; the poll below is what
 * completes the login when the user comes back.
 *
 * Everything here is plain fetch against the issuer, with the poll cadence
 * fixed: the provider cancels an over-polling request rather than throttling
 * it, so a "retry faster on error" strategy here would kill the login it is
 * trying to save. When the app is backgrounded the OS suspends timers and may
 * fail requests; the loop resumes at the same cadence and polls once
 * immediately when AppState returns to 'active', so a login approved while
 * this app was in the background completes the moment it is foregrounded.
 */

import { AppState } from 'react-native';
import {
  POLL_INTERVAL_ENROLLING_MS,
  POLL_INTERVAL_MS,
  SDK_VERSION,
  WIRE_VERSION,
  type PairStartResponse,
  type PairStatusResponse,
  type TokenResponse,
} from './wire';
import type { ErrorCode, NonOAuthError, PairingState } from './types';

/**
 * The pending window is 120 seconds and the claimed window 180. When the poll
 * cannot reach the provider (offline, or suspended in the background) it keeps
 * retrying at the normal cadence until this long past the last deadline the
 * provider stated, then gives up as request_expired: a stale return to the
 * foreground must resolve cleanly, not spin forever.
 */
const OFFLINE_EXPIRY_GRACE_MS = 15_000;

export class OAuthFlowError extends Error {
  constructor(
    public error: ErrorCode,
    public description?: string
  ) {
    super(description ?? error);
  }
}

export class FlowAbandonedError extends Error {
  constructor(public reason: NonOAuthError) {
    super(reason.description ?? reason.type);
  }
}

/** Abort rejections from fetch, and from our own sleep, share one name. */
export const isAbortError = (e: unknown): boolean =>
  typeof e === 'object' && e !== null && (e as { name?: unknown }).name === 'AbortError';

const abortError = (): Error => {
  const e = new Error('aborted');
  e.name = 'AbortError';
  return e;
};

export interface StartPairingParams {
  client_id: string;
  scope: string;
  state: string;
  nonce: string;
  code_challenge: string;
  redirect_uri?: string;
  acr_values?: string;
  max_age?: number;
  prompt?: string;
  locale?: string;
}

async function parseJson(response: Response): Promise<Record<string, unknown>> {
  try {
    return (await response.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export async function startPairing(
  issuer: string,
  params: StartPairingParams
): Promise<PairStartResponse> {
  const response = await fetch(`${issuer}/pair`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...params,
      code_challenge_method: 'S256',
      wire_version: WIRE_VERSION,
      sdk: `@zoreal/oauth2-react-native/${SDK_VERSION}`,
    }),
  });

  const body = await parseJson(response);
  if (!response.ok) {
    // The provider's words, verbatim. A refused package version arrives here,
    // and rewriting its reason would hide the only signal telling an integrator
    // to upgrade.
    throw new OAuthFlowError(
      (body.error as ErrorCode) ?? 'server_error',
      (body.error_description as string) ?? `The provider refused the request (${response.status})`
    );
  }
  return body as unknown as PairStartResponse;
}

export interface PollOptions {
  onState?: (state: PairingState) => void;
  signal?: AbortSignal;
  /** Seconds until the pending request expires, from the create response. */
  expiresIn?: number;
}

/**
 * Polls until the request resolves. Returns the authorization code.
 * Throws FlowAbandonedError for the human outcomes (denied, expired,
 * withdrawn) and OAuthFlowError for protocol ones.
 */
export async function pollUntilApproved(
  issuer: string,
  requestId: string,
  options: PollOptions = {}
): Promise<string> {
  const { onState, signal } = options;

  // The wake hook: whichever sleep is in flight ends early when the app
  // returns to the foreground, so the first poll after a background gap
  // happens immediately rather than up to a full interval later.
  let wake: (() => void) | null = null;
  let subscription: { remove: () => void } | undefined;
  try {
    subscription = AppState.addEventListener('change', (next) => {
      if (next === 'active') wake?.();
    });
  } catch {
    // No AppState implementation (a bare JS runtime): polling still works,
    // it just cannot wake early.
  }

  const sleep = (ms: number): Promise<void> =>
    new Promise<void>((resolve, reject) => {
      if (signal?.aborted) {
        reject(abortError());
        return;
      }
      const finish = () => {
        cleanup();
        resolve();
      };
      const onAbort = () => {
        cleanup();
        reject(abortError());
      };
      const timer = setTimeout(finish, ms);
      const cleanup = () => {
        clearTimeout(timer);
        signal?.removeEventListener('abort', onAbort);
        wake = null;
      };
      signal?.addEventListener('abort', onAbort);
      wake = finish;
    });

  // The latest moment the provider said this request could still be alive.
  // Pending and claimed responses carry expires_in; enrolling carries an
  // absolute deadline. Used only when the provider is unreachable.
  let deadlineAt: number | null =
    typeof options.expiresIn === 'number' ? Date.now() + options.expiresIn * 1000 : null;

  try {
    for (;;) {
      let body: PairStatusResponse;
      try {
        const response = await fetch(`${issuer}/pair/${encodeURIComponent(requestId)}/status`, {
          signal,
        });
        body = (await parseJson(response)) as unknown as PairStatusResponse;
        if (!response.ok) {
          throw new OAuthFlowError(
            (body.error as ErrorCode) ?? 'server_error',
            body.error_description ?? `Pairing status failed (${response.status})`
          );
        }
      } catch (e) {
        if (e instanceof OAuthFlowError || isAbortError(e)) throw e;
        // A transport failure: offline, or the OS suspended the app mid-poll.
        // Retry at the normal cadence, NEVER faster, unless the request's own
        // window has clearly passed while the provider was out of reach.
        if (deadlineAt !== null && Date.now() > deadlineAt + OFFLINE_EXPIRY_GRACE_MS) {
          throw new FlowAbandonedError({
            type: 'request_expired',
            description: 'the pairing request expired while the provider was unreachable',
          });
        }
        await sleep(POLL_INTERVAL_MS);
        continue;
      }

      onState?.({
        status: body.status,
        expiresIn: body.expires_in,
        enrolmentDeadline: body.enrolment_deadline,
      });

      switch (body.status) {
        case 'approved':
          if (!body.code) {
            throw new OAuthFlowError('server_error', 'approved with no authorization code');
          }
          return body.code;
        case 'denied':
          throw new FlowAbandonedError({
            type: 'request_denied',
            description: body.error_description,
          });
        case 'expired':
          throw new FlowAbandonedError({
            type: 'request_expired',
            description: body.error_description,
          });
        case 'cancelled':
          // The provider withdrew the request. Terminal, like expired, and
          // surfaced the same way rather than polled forever.
          throw new FlowAbandonedError({
            type: 'request_expired',
            description: body.error_description ?? 'the provider cancelled the pairing request',
          });
        case 'enrolling':
          if (typeof body.enrolment_deadline === 'number') {
            deadlineAt = body.enrolment_deadline * 1000;
          }
          await sleep(POLL_INTERVAL_ENROLLING_MS);
          break;
        default:
          if (typeof body.expires_in === 'number') {
            deadlineAt = Date.now() + body.expires_in * 1000;
          }
          await sleep(POLL_INTERVAL_MS);
      }
    }
  } finally {
    subscription?.remove();
  }
}

/**
 * The code exchange, browser-direct mode only: a public client, PKCE and no
 * secret. What comes back can only ever be the pseudonymous tier, by
 * construction rather than by rule: personal data lives at /userinfo behind an
 * access token this mode is never issued, because personal-data scopes are
 * refused for public clients at the pairing step.
 */
export async function exchangeCode(
  issuer: string,
  input: { code: string; code_verifier: string; client_id: string }
): Promise<TokenResponse> {
  const response = await fetch(`${issuer}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: input.code,
      code_verifier: input.code_verifier,
      client_id: input.client_id,
    }).toString(),
  });

  const body = (await parseJson(response)) as unknown as TokenResponse;
  if (!response.ok || body.error) {
    throw new OAuthFlowError(
      (body.error as ErrorCode) ?? 'server_error',
      body.error_description ?? `Token exchange failed (${response.status})`
    );
  }
  return body;
}
