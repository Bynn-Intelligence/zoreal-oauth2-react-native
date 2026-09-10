import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * The real timer, captured before any test installs fake ones. The fake
 * clock's zero-length ticks drain promise callbacks, but work that finishes
 * on the platform's thread pool (the PKCE digest goes through WebCrypto)
 * is delivered by the event loop, and a tick that never reaches it leaves
 * the flow waiting forever. Yielding through this between ticks lets it in.
 */
const realSetTimeout = globalThis.setTimeout;
const yieldToEventLoop = () => new Promise<void>((resolve) => realSetTimeout(resolve, 1));
import { runLoginFlow, type ActivePairing, type SetPairing } from '../src/flow';
import { challengeS256 } from '../src/pkce';
import type { PairingState, ZorealCodeResponse, ZorealCredentialResponse } from '../src/types';
import { Linking, __setPlatform } from './mocks/react-native';

const ISSUER = 'https://id.zoreal.test';
const CTX = { clientId: 'ast_x', issuer: ISSUER };

const b64url = (s: string) => Buffer.from(s, 'utf8').toString('base64url');
const ID_TOKEN = `${b64url('{"alg":"ES256"}')}.${b64url('{"acr":"zoreal.live","sub":"7QK3"}')}.sig`;

/**
 * A response shaped the way the code reads one (ok, status, json()), built
 * without the platform's body streams. A real Response resolves json()
 * through several stream promise hops, and how many of them a zero-length
 * fake-timer tick drains differs by Node build: the frame tests passed on a
 * Mac and failed on the Linux runners for that reason alone. This body
 * settles in one hop, so a tick means the same thing everywhere.
 */
const json = (body: unknown, status = 200) =>
  ({
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers({ 'Content-Type': 'application/json' }),
    json: async () => body,
    text: async () => JSON.stringify(body),
  }) as unknown as Response;

/** A stand-in for React state that records what the flow published. */
const makePairingStore = () => {
  let current: ActivePairing | null = null;
  const setPairing: SetPairing = (update) => {
    current = typeof update === 'function' ? update(current) : update;
  };
  return { setPairing, get: () => current };
};

type Routes = {
  pair?: () => Response;
  status?: () => Response;
  token?: () => Response;
};

const routeFetch = (routes: Routes) =>
  vi.spyOn(globalThis, 'fetch').mockImplementation((input: RequestInfo | URL) => {
    const url = String(input);
    if (url.endsWith('/pair')) {
      return Promise.resolve(
        (routes.pair ?? (() => json({ request_id: 'r1', pair_url: 'https://zoreal.com/qr/r1', expires_in: 120 })))()
      );
    }
    if (url.includes('/status')) {
      return Promise.resolve((routes.status ?? (() => json({ status: 'approved', code: 'code-1' })))());
    }
    if (url.endsWith('/token')) {
      return Promise.resolve((routes.token ?? (() => json({ id_token: ID_TOKEN })))());
    }
    return Promise.reject(new Error(`unexpected fetch: ${url}`));
  });

beforeEach(() => {
  (Linking.openURL as ReturnType<typeof vi.fn>).mockClear();
  (Linking.openURL as ReturnType<typeof vi.fn>).mockImplementation(async () => {});
  __setPlatform({ isPad: false, isTV: false });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('browser-direct mode (public client, same device)', () => {
  it('opens the pairing link, keeps polling here, exchanges with PKCE and no secret', async () => {
    const fetchMock = routeFetch({});
    const store = makePairingStore();
    const onCredential = vi.fn<(r: ZorealCredentialResponse) => void>();

    await runLoginFlow(CTX, { flow: 'browser-direct', onCredential }, new AbortController(), store.setPairing);

    // Same-device: the universal link went out through Linking, and the poll
    // in THIS app completed the flow. Nothing came back via redirect.
    expect(Linking.openURL).toHaveBeenCalledWith('https://zoreal.com/qr/r1');

    expect(onCredential).toHaveBeenCalledTimes(1);
    const response = onCredential.mock.calls[0][0];
    expect(response.credential).toBe(ID_TOKEN);
    expect(response.clientId).toBe('ast_x');
    expect(response.select_by).toBe('app_link');
    expect(response.acr).toBe('zoreal.live');

    const tokenCall = fetchMock.mock.calls.find(([u]) => String(u).endsWith('/token'))!;
    const body = new URLSearchParams(tokenCall[1]!.body as string);
    expect(body.get('client_id')).toBe('ast_x');
    expect(body.get('code')).toBe('code-1');
    expect(body.get('code_verifier')).toMatch(/^[A-Za-z0-9_-]{43,128}$/);
    expect(body.get('client_secret')).toBeNull();

    expect(store.get()).toBeNull(); // the pairing surface was cleared
  });

  it('resolves an immediate prompt=none code as select_by session', async () => {
    routeFetch({ pair: () => json({ code: 'silent-1' }) });
    const onCredential = vi.fn<(r: ZorealCredentialResponse) => void>();

    await runLoginFlow(
      CTX,
      { flow: 'browser-direct', prompt: 'none', onCredential },
      new AbortController(),
      makePairingStore().setPairing
    );

    expect(Linking.openURL).not.toHaveBeenCalled();
    expect(onCredential.mock.calls[0][0].select_by).toBe('session');
  });
});

describe('auth-code mode (the backend completes the exchange)', () => {
  it('hands over code, code_verifier and nonce, and never touches /token', async () => {
    const fetchMock = routeFetch({});
    const onCode = vi.fn<(r: ZorealCodeResponse) => void>();

    await runLoginFlow(
      CTX,
      {
        flow: 'auth-code',
        scope: 'openid email profile.name',
        app_state: 'return-to-cart',
        redirect_uri: 'https://rp.example/callback',
        onCode,
      },
      new AbortController(),
      makePairingStore().setPairing
    );

    expect(onCode).toHaveBeenCalledTimes(1);
    const handed = onCode.mock.calls[0][0];
    expect(handed.code).toBe('code-1');
    expect(handed.scope).toBe('openid email profile.name');
    expect(handed.app_state).toBe('return-to-cart');
    expect(handed.nonce).toMatch(/^[A-Za-z0-9_-]+$/);

    // The verifier handed to the caller is the one behind the challenge the
    // provider stored: the backend can only complete the exchange with it.
    const pairCall = fetchMock.mock.calls.find(([u]) => String(u).endsWith('/pair'))!;
    const pairBody = JSON.parse(pairCall[1]!.body as string);
    expect(await challengeS256(handed.code_verifier)).toBe(pairBody.code_challenge);
    expect(pairBody.nonce).toBe(handed.nonce);
    expect(pairBody.redirect_uri).toBe('https://rp.example/callback');

    expect(fetchMock.mock.calls.some(([u]) => String(u).endsWith('/token'))).toBe(false);
  });
});

describe('the QR surface (tablet, or display: "qr")', () => {
  it('display "qr" exposes pairUrl and qrUrl through the state callback instead of opening the link', async () => {
    routeFetch({});
    const states: PairingState[] = [];

    await runLoginFlow(
      CTX,
      {
        flow: 'auth-code',
        display: 'qr',
        onCode: vi.fn(),
        onPairingStateChange: (s) => states.push(s),
      },
      new AbortController(),
      makePairingStore().setPairing
    );

    expect(Linking.openURL).not.toHaveBeenCalled();
    expect(states[0].status).toBe('pending');
    expect(states[0].pairUrl).toBe('https://zoreal.com/qr/r1');
    expect(states[0].qrUrl).toBe(`${ISSUER}/pair/r1/qr.svg`);
    expect(states[0].appLink).toBe(false);
    expect(typeof states[0].cancel).toBe('function');
  });

  it('a tablet resolves display "auto" to the QR surface', async () => {
    __setPlatform({ isPad: true });
    routeFetch({});
    const onCredential = vi.fn<(r: ZorealCredentialResponse) => void>();

    await runLoginFlow(CTX, { flow: 'browser-direct', onCredential }, new AbortController(), makePairingStore().setPairing);

    expect(Linking.openURL).not.toHaveBeenCalled();
    expect(onCredential.mock.calls[0][0].select_by).toBe('qr');
  });
});

describe('the animated QR code', () => {
  const BARE_QR = `${ISSUER}/pair/r1/qr.svg`;

  const qrPair = (extra: Record<string, unknown> = {}) => () =>
    json({
      request_id: 'r1',
      pair_url: 'https://zoreal.com/login/r1',
      expires_in: 120,
      display: 'qr',
      ...extra,
    });

  const pending = () => json({ status: 'pending', expires_in: 118 });

  /** Runs a QR pairing that never resolves, so the frames can be watched. */
  const startQrFlow = (routes: Parameters<typeof routeFetch>[0]) => {
    const controller = new AbortController();
    const states: PairingState[] = [];
    routeFetch(routes);
    const done = runLoginFlow(
      CTX,
      {
        flow: 'auth-code',
        display: 'qr',
        onCode: vi.fn(),
        onPairingStateChange: (s) => states.push(s),
      },
      controller,
      makePairingStore().setPairing
    );
    return { controller, states, done };
  };

  /**
   * Lets the pairing get off the ground without moving the clock: generating
   * the PKCE challenge and creating the pairing take several turns of the
   * event loop, and the frame cadence below is asserted to the millisecond.
   */
  /**
   * Drains zero-length ticks until the flow has published its first state,
   * rather than a fixed number of them: the first publish sits behind the
   * pairing request's promise chain, and a count that is enough on one
   * machine is a race on the next.
   */
  const untilPublished = async (run: { states: PairingState[] }) => {
    for (let i = 0; i < 200 && run.states.length === 0; i++) {
      await yieldToEventLoop();
      await vi.advanceTimersByTimeAsync(0);
    }
    if (run.states.length === 0) throw new Error('the flow never published a state');
  };

  const stop = async (run: { controller: AbortController; done: Promise<void> }) => {
    run.controller.abort();
    await yieldToEventLoop();
    await vi.advanceTimersByTimeAsync(0);
    await run.done;
  };

  it('resolves the surface before the pairing exists and sends it as display', async () => {
    const fetchMock = routeFetch({ pair: qrPair() });

    await runLoginFlow(
      CTX,
      { flow: 'browser-direct', display: 'qr', onCredential: vi.fn() },
      new AbortController(),
      makePairingStore().setPairing
    );

    const pairBody = JSON.parse(
      fetchMock.mock.calls.find(([u]) => String(u).endsWith('/pair'))![1]!.body as string
    );
    expect(pairBody.display).toBe('qr');
  });

  it('sends display "link" from a phone and opens pair_url with its start token untouched', async () => {
    const startLink = 'https://zoreal.com/login/r1?t=8ZQ4RC5T9WPX2K7NM3HJ0VBD';
    const fetchMock = routeFetch({
      pair: () => json({ request_id: 'r1', pair_url: startLink, expires_in: 120, display: 'link' }),
    });
    const states: PairingState[] = [];

    await runLoginFlow(
      CTX,
      { flow: 'browser-direct', onCredential: vi.fn(), onPairingStateChange: (s) => states.push(s) },
      new AbortController(),
      makePairingStore().setPairing
    );

    const pairBody = JSON.parse(
      fetchMock.mock.calls.find(([u]) => String(u).endsWith('/pair'))![1]!.body as string
    );
    expect(pairBody.display).toBe('link');
    // Verbatim, query string included: the start token is what lets this
    // pairing be claimed at all.
    expect(Linking.openURL).toHaveBeenCalledWith(startLink);
    expect(states[0].pairUrl).toBe(startLink);
    // And no QR is offered for it: the provider serves none for a link pairing.
    expect(states[0].qrUrl).toBeUndefined();
    expect(states[0].qrRefreshSeconds).toBeUndefined();
  });

  it('publishes a fresh frame on the cadence the provider asked for', async () => {
    vi.useFakeTimers();
    const run = startQrFlow({ pair: qrPair({ qr_refresh_seconds: 5 }), status: pending });

    await untilPublished(run);
    expect(run.states[0].qrUrl).toBe(BARE_QR);
    expect(run.states[0].qrRefreshSeconds).toBe(5);

    // The poll publishes states of its own every two seconds. None of them is
    // a new frame until the refresh actually falls due.
    await vi.advanceTimersByTimeAsync(4999);
    expect(run.states.every((s) => s.qrUrl === BARE_QR)).toBe(true);

    await vi.advanceTimersByTimeAsync(1);
    const framed = run.states[run.states.length - 1];
    expect(framed.status).toBe('pending');
    expect(framed.qrUrl!.startsWith(`${BARE_QR}?t=`)).toBe(true);
    expect(framed.qrUrl).toMatch(/\?t=\d+$/);

    // Again on the same cadence, and never the same URL twice: an image cache
    // keyed on the URL would otherwise keep showing the spent frame.
    await vi.advanceTimersByTimeAsync(5000);
    expect(run.states[run.states.length - 1].qrUrl).not.toBe(framed.qrUrl);

    await stop(run);
  });

  it('falls back to three seconds when the provider states no cadence', async () => {
    vi.useFakeTimers();
    const run = startQrFlow({ pair: qrPair(), status: pending });

    await untilPublished(run);
    expect(run.states[0].qrRefreshSeconds).toBe(3);

    await vi.advanceTimersByTimeAsync(2999);
    expect(run.states.every((s) => s.qrUrl === BARE_QR)).toBe(true);

    await vi.advanceTimersByTimeAsync(1);
    expect(run.states[run.states.length - 1].qrUrl).toMatch(/\?t=\d+$/);

    await stop(run);
  });

  it('stops refreshing once the pairing is claimed: the code is spent', async () => {
    vi.useFakeTimers();
    const statuses = [
      { status: 'pending', expires_in: 118 },
      { status: 'pending', expires_in: 116 },
      { status: 'claimed', expires_in: 179 },
    ];
    const run = startQrFlow({
      pair: qrPair({ qr_refresh_seconds: 1 }),
      status: () => json(statuses.length > 1 ? statuses.shift() : statuses[0]),
    });

    // Claimed on the third poll, at four seconds, with a frame every second
    // until then.
    await untilPublished(run);
    await vi.advanceTimersByTimeAsync(4100);
    const seen = new Set(run.states.map((s) => s.qrUrl));
    expect(seen.size).toBeGreaterThan(2);
    expect(run.states.some((s) => s.status === 'claimed')).toBe(true);

    // The poll keeps running while the holder approves on the phone; the
    // frames do not.
    await vi.advanceTimersByTimeAsync(30_000);
    expect(new Set(run.states.map((s) => s.qrUrl)).size).toBe(seen.size);

    await stop(run);
  });
});

describe('failure surfacing', () => {
  it('reports a denial as request_denied and never calls onSuccess', async () => {
    routeFetch({ status: () => json({ status: 'denied' }) });
    const onCredential = vi.fn();
    const onNonOAuthError = vi.fn();

    await runLoginFlow(
      CTX,
      { flow: 'browser-direct', onCredential, onNonOAuthError },
      new AbortController(),
      makePairingStore().setPairing
    );

    expect(onNonOAuthError).toHaveBeenCalledWith(expect.objectContaining({ type: 'request_denied' }));
    expect(onCredential).not.toHaveBeenCalled();
  });

  it("reports the provider's refusal to pair verbatim through onError", async () => {
    routeFetch({
      pair: () => json({ error: 'invalid_scope', error_description: 'email needs a confidential client' }, 400),
    });
    const onError = vi.fn();

    await runLoginFlow(
      CTX,
      { flow: 'browser-direct', onError },
      new AbortController(),
      makePairingStore().setPairing
    );

    expect(onError).toHaveBeenCalledWith({
      error: 'invalid_scope',
      description: 'email needs a confidential client',
    });
  });

  it('surfaces link_failed_to_open and stops the poll when the link cannot open', async () => {
    vi.useFakeTimers();
    (Linking.openURL as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('No app can handle this URL')
    );
    routeFetch({ status: () => json({ status: 'pending', expires_in: 118 }) });
    const onNonOAuthError = vi.fn();
    const onCredential = vi.fn();
    const store = makePairingStore();

    const done = runLoginFlow(
      CTX,
      { flow: 'browser-direct', onCredential, onNonOAuthError },
      new AbortController(),
      store.setPairing
    );
    await vi.advanceTimersByTimeAsync(50);
    await done; // resolves because the poll was aborted, not after a timeout

    expect(onNonOAuthError).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'link_failed_to_open' })
    );
    expect(onCredential).not.toHaveBeenCalled();
    expect(store.get()).toBeNull();
  });
});
