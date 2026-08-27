import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { runLoginFlow, type ActivePairing, type SetPairing } from '../src/flow';
import { challengeS256 } from '../src/pkce';
import type { PairingState, ZorealCodeResponse, ZorealCredentialResponse } from '../src/types';
import { Linking, __setPlatform } from './mocks/react-native';

const ISSUER = 'https://id.zoreal.test';
const CTX = { clientId: 'ast_x', issuer: ISSUER };

const b64url = (s: string) => Buffer.from(s, 'utf8').toString('base64url');
const ID_TOKEN = `${b64url('{"alg":"ES256"}')}.${b64url('{"acr":"zoreal.live","sub":"7QK3"}')}.sig`;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

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
