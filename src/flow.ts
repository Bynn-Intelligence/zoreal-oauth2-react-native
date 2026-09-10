/**
 * The one login flow, as a plain async function so the state machine is
 * testable without a renderer. useZorealFlow wraps it in React state; the
 * button wraps that.
 *
 * Same-device is the primary path on a phone: start the pairing, open the
 * pairing URL with Linking (the ZOREAL ID app claims it as a universal link;
 * with no app installed the same URL is the real pairing page, which can
 * enrol), and KEEP POLLING HERE. The ZOREAL app never returns control by
 * redirect; this app's poll is what completes the flow, including after a
 * round trip through the background.
 *
 * Completion is per mode: browser-direct exchanges the code here (public
 * client, PKCE, no secret) and hands over an ID token; auth-code hands the
 * code, the PKCE verifier and the nonce to the caller, whose backend does the
 * exchange with its client authentication.
 */

import { Linking, Platform } from 'react-native';
import { unsafeClaims } from './jwt';
import { DEFAULT_QR_REFRESH_SECONDS } from './wire';
import {
  FlowAbandonedError,
  OAuthFlowError,
  exchangeCode,
  isAbortError,
  pollUntilApproved,
  startPairing,
} from './pairing';
import { challengeS256, generateState, generateVerifier } from './pkce';
import type {
  AcrValue,
  ErrorCode,
  NonOAuthError,
  PairingState,
  SelectBy,
  ZorealCodeResponse,
  ZorealCredentialResponse,
  ZorealLoginRequestOptions,
} from './types';

export interface ActivePairing {
  requestId: string;
  pairUrl: string;
  /** QR surface only, and it changes with every frame. Absent in app-link mode. */
  qrUrl?: string;
  state: PairingState;
  /** True when the flow opened the app link rather than exposing the QR surface. */
  appLink: boolean;
  cancel: () => void;
}

/**
 * The internal option shape: one flow discriminator, one success callback per
 * mode. The public API keeps a single overloaded onSuccess; this type exists
 * because an intersection of those two signatures is uninhabitable, and the
 * mapping from public to internal happens once, in useZorealLogin.
 */
export interface InternalFlowOptions extends ZorealLoginRequestOptions {
  flow: 'browser-direct' | 'auth-code';
  redirect_uri?: string;
  onCredential?: (response: ZorealCredentialResponse) => void;
  onCode?: (response: ZorealCodeResponse) => void;
  onError?: (error: Pick<NonOAuthError, 'description'> & { error: ErrorCode }) => void;
  onNonOAuthError?: (error: NonOAuthError) => void;
}

export type SetPairing = (
  update: ActivePairing | null | ((current: ActivePairing | null) => ActivePairing | null)
) => void;

export interface FlowContext {
  clientId: string;
  issuer: string;
  locale?: string;
}

/**
 * A tablet or TV is where a QR belongs: the phone that approves is a second
 * device. A phone gets the app link. Platform.isPad and Platform.isTV are the
 * two signals React Native provides without a native module; display: 'qr'
 * or 'link' overrides the guess. Whatever this resolves to is sent to the
 * provider and binds the pairing, so a wrong guess is a login that refuses to
 * be claimed rather than one that quietly falls back.
 */
function isLargeFormFactor(): boolean {
  const platform = Platform as unknown as { isPad?: boolean; isTV?: boolean };
  return platform.isPad === true || platform.isTV === true;
}

export async function runLoginFlow(
  ctx: FlowContext,
  opts: InternalFlowOptions,
  controller: AbortController,
  setPairing: SetPairing
): Promise<void> {
  const verifier = generateVerifier();
  const state = generateState();
  const nonce = generateState();

  // Which surface this login will use, decided BEFORE the pairing exists: the
  // provider binds the pairing to the answer and enforces it on the claim, so
  // it cannot be a decision taken once the response is back.
  const useQr = opts.display === 'qr' || (opts.display !== 'link' && isLargeFormFactor());

  // Set once the QR frame loop starts. The finally below is what stops it, on
  // every exit there is: approval, refusal, cancel, unmount, abort.
  let stopQrFrames: () => void = () => {};

  try {
    const started = await startPairing(ctx.issuer, {
      client_id: ctx.clientId,
      scope: opts.scope ?? 'openid',
      state,
      nonce,
      code_challenge: await challengeS256(verifier),
      redirect_uri: opts.flow === 'auth-code' ? opts.redirect_uri : undefined,
      acr_values: Array.isArray(opts.acr_values) ? opts.acr_values.join(' ') : opts.acr_values,
      max_age: opts.max_age,
      prompt: opts.prompt,
      locale: ctx.locale,
      display: useQr ? 'qr' : 'link',
    });

    let code: string;
    let selectBy: SelectBy = 'device';

    if ('code' in started) {
      // prompt=none resolved silently: consented sector, live session.
      code = started.code;
      selectBy = 'session';
    } else {
      selectBy = useQr ? 'qr' : 'app_link';

      const cancel = () => {
        controller.abort();
        setPairing(null);
      };

      const qrEndpoint = `${ctx.issuer}/pair/${encodeURIComponent(started.request_id)}/qr.svg`;
      const refreshSeconds =
        typeof started.qr_refresh_seconds === 'number' && started.qr_refresh_seconds > 0
          ? started.qr_refresh_seconds
          : DEFAULT_QR_REFRESH_SECONDS;
      // App-link mode gets no qrUrl at all. The provider serves no QR for a
      // pairing bound to the same-device link, so handing one over would be
      // handing over an image that 404s, and a code drawn from the link
      // instead is one the app is meant to refuse.
      let qrUrl: string | undefined = useQr ? qrEndpoint : undefined;

      // Everything a caller-rendered pairing UI needs, on every state it
      // sees: the QR surface cannot complete unless SOMETHING renders the
      // image, and on native that something is always the caller. Read fresh
      // each time, because qrUrl moves.
      const surface = () => ({
        pairUrl: started.pair_url,
        qrUrl,
        qrRefreshSeconds: useQr ? refreshSeconds : undefined,
        appLink: !useQr,
        cancel,
      });

      let published: PairingState = {
        status: 'pending',
        expiresIn: started.expires_in,
        ...surface(),
      };
      const publish = (next: PairingState) => {
        published = next;
        setPairing((p) =>
          p && p.requestId === started.request_id ? { ...p, qrUrl, state: next } : p
        );
        opts.onPairingStateChange?.(next);
      };

      const active: ActivePairing = {
        requestId: started.request_id,
        pairUrl: started.pair_url,
        qrUrl,
        state: published,
        appLink: !useQr,
        cancel,
      };
      setPairing(active);
      // The initial state, immediately: the first poll response is one
      // round-trip away, and a UI that waits for it opens visibly empty.
      opts.onPairingStateChange?.(active.state);

      // The QR animates. Each fetch of the image returns the frame that is
      // current on the provider's clock, and the provider refuses a frame
      // that has aged out, so a screenshot someone relays to a victim is
      // spent long before they can act on it. Re-fetching on the provider's
      // cadence is this package's whole part in that: the frames are rendered
      // and keyed server side, and nothing here generates a code.
      //
      // The deadline moves in fixed steps rather than counting from each
      // wake-up, so the cadence does not drift; a step that has already
      // passed (the app was backgrounded) is moved forward instead of firing
      // a burst of frames to catch up on a screen nobody was watching.
      if (useQr) {
        let timer: ReturnType<typeof setTimeout> | null = null;
        let nextFrameAt = Date.now() + refreshSeconds * 1000;
        const scheduleFrame = () => {
          const now = Date.now();
          if (nextFrameAt <= now) nextFrameAt = now + refreshSeconds * 1000;
          timer = setTimeout(() => {
            // The cache-buster is what makes the swap visible: an image cache
            // keyed on the URL alone would keep showing the frame that has
            // just expired.
            qrUrl = `${qrEndpoint}?t=${Date.now()}`;
            publish({ ...published, ...surface() });
            nextFrameAt += refreshSeconds * 1000;
            scheduleFrame();
          }, nextFrameAt - now);
        };
        stopQrFrames = () => {
          if (timer !== null) {
            clearTimeout(timer);
            timer = null;
          }
        };
        scheduleFrame();
      }

      if (!useQr) {
        // The universal link. Not awaited ahead of the poll: the OS may
        // background this app the moment the link opens, and the poll below
        // must already be the thing waiting when control returns.
        Linking.openURL(started.pair_url).catch((e: unknown) => {
          controller.abort();
          setPairing(null);
          opts.onNonOAuthError?.({
            type: 'link_failed_to_open',
            description: e instanceof Error ? e.message : String(e),
          });
        });
      }

      code = await pollUntilApproved(ctx.issuer, started.request_id, {
        signal: controller.signal,
        expiresIn: started.expires_in,
        onState: (s) => {
          // A pairing that has left 'pending' has spent its code: claimed and
          // enrolling are on the phone now, and the rest are terminal. Frames
          // past that point would be images nothing can claim.
          if (s.status !== 'pending') stopQrFrames();
          publish({ ...s, ...surface() });
        },
      });
    }

    setPairing(null);

    if (opts.flow === 'auth-code') {
      opts.onCode?.({
        code,
        scope: opts.scope ?? 'openid',
        app_state: opts.app_state,
        code_verifier: verifier,
        nonce,
      });
      return;
    }

    const tokens = await exchangeCode(ctx.issuer, {
      code,
      code_verifier: verifier,
      client_id: ctx.clientId,
    });
    const claims = unsafeClaims(tokens.id_token);
    const response: ZorealCredentialResponse = {
      credential: tokens.id_token,
      clientId: ctx.clientId,
      select_by: selectBy,
      acr: (claims.acr as AcrValue) ?? 'zoreal.device',
    };
    opts.onCredential?.(response);
  } catch (e) {
    setPairing(null);
    if (isAbortError(e)) return;
    if (e instanceof FlowAbandonedError) {
      opts.onNonOAuthError?.(e.reason);
      return;
    }
    if (e instanceof OAuthFlowError) {
      opts.onError?.({ error: e.error, description: e.description });
      return;
    }
    opts.onNonOAuthError?.({
      type: 'unknown',
      description: e instanceof Error ? e.message : String(e),
    });
  } finally {
    stopQrFrames();
  }
}
