import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  FlowAbandonedError,
  OAuthFlowError,
  exchangeCode,
  pollUntilApproved,
  startPairing,
} from '../src/pairing';
import { __appStateListenerCount, __emitAppState } from './mocks/react-native';

const ISSUER = 'https://id.zoreal.test';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('startPairing', () => {
  it('sends the wire version, the PKCE method and this package as the sdk', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        json({ request_id: 'r1', pair_url: 'https://zoreal.com/qr/r1', expires_in: 120 })
      );

    const started = await startPairing(ISSUER, {
      client_id: 'ast_x',
      scope: 'openid',
      state: 's',
      nonce: 'n',
      code_challenge: 'c',
    });

    expect(started).toMatchObject({ request_id: 'r1' });
    const body = JSON.parse(fetchMock.mock.calls[0][1]!.body as string);
    expect(body.code_challenge_method).toBe('S256');
    expect(body.wire_version).toBe(1);
    expect(body.sdk).toMatch(/^@zoreal\/oauth2-react-native\/\d+\.\d+\.\d+$/);
  });

  it("surfaces the provider's refusal verbatim", async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      json({ error: 'access_denied', error_description: 'sdk 0.0.9 is refused: CVE-XXXX' }, 400)
    );
    await expect(
      startPairing(ISSUER, {
        client_id: 'ast_x',
        scope: 'openid',
        state: 's',
        nonce: 'n',
        code_challenge: 'c',
      })
    ).rejects.toMatchObject({ description: 'sdk 0.0.9 is refused: CVE-XXXX' });
  });
});

describe('pollUntilApproved', () => {
  it('walks pending, claimed, approved and returns the code', async () => {
    vi.useFakeTimers();
    const states = [
      { status: 'pending', expires_in: 118 },
      { status: 'claimed', expires_in: 179 },
      { status: 'approved', code: 'code-1' },
    ];
    vi.spyOn(globalThis, 'fetch').mockImplementation(() => Promise.resolve(json(states.shift())));

    const seen: string[] = [];
    const codePromise = pollUntilApproved(ISSUER, 'r1', {
      onState: (s) => seen.push(s.status),
    });
    await vi.advanceTimersByTimeAsync(10_000);
    expect(await codePromise).toBe('code-1');
    expect(seen).toEqual(['pending', 'claimed', 'approved']);
  });

  it('polls at the fixed 2000ms cadence while pending', async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(() => Promise.resolve(json({ status: 'pending', expires_in: 100 })));

    const promise = pollUntilApproved(ISSUER, 'r1');
    await vi.advanceTimersByTimeAsync(0);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1999);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);

    fetchMock.mockImplementation(() => Promise.resolve(json({ status: 'approved', code: 'c' })));
    await vi.advanceTimersByTimeAsync(2000);
    expect(await promise).toBe('c');
  });

  it('slows to the 5000ms cadence while enrolling', async () => {
    vi.useFakeTimers();
    const states = [
      { status: 'enrolling', enrolment_deadline: Math.floor(Date.now() / 1000) + 1800 },
      { status: 'approved', code: 'code-1' },
    ];
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(() => Promise.resolve(json(states.shift())));

    const promise = pollUntilApproved(ISSUER, 'r1');
    await vi.advanceTimersByTimeAsync(0);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(4999);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(await promise).toBe('code-1');
  });

  it('throws the human outcomes as FlowAbandonedError', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(json({ status: 'denied' }));
    await expect(pollUntilApproved(ISSUER, 'r1')).rejects.toBeInstanceOf(FlowAbandonedError);
  });

  it('maps a provider-cancelled request to request_expired rather than polling forever', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(json({ status: 'cancelled' }));
    await expect(pollUntilApproved(ISSUER, 'r1')).rejects.toMatchObject({
      reason: { type: 'request_expired' },
    });
  });

  it("surfaces the provider's answer for an unknown request verbatim", async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      json({ error: 'invalid_request', error_description: 'unknown pairing request' }, 404)
    );
    await expect(pollUntilApproved(ISSUER, 'r1')).rejects.toMatchObject({
      error: 'invalid_request',
      description: 'unknown pairing request',
    });
  });

  it('never polls faster after a transport error', async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementationOnce(() => Promise.reject(new TypeError('Network request failed')))
      .mockImplementation(() => Promise.resolve(json({ status: 'approved', code: 'c' })));

    const promise = pollUntilApproved(ISSUER, 'r1');
    await vi.advanceTimersByTimeAsync(0);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1999);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(await promise).toBe('c');
  });

  it('removes its AppState listener when the poll ends', async () => {
    const before = __appStateListenerCount();
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(json({ status: 'approved', code: 'c' }));
    await pollUntilApproved(ISSUER, 'r1');
    expect(__appStateListenerCount()).toBe(before);
  });
});

describe('pollUntilApproved across app backgrounding', () => {
  it('polls again immediately when the app returns to the foreground', async () => {
    vi.useFakeTimers();
    const states = [
      { status: 'pending', expires_in: 118 },
      { status: 'claimed', expires_in: 179 },
      { status: 'approved', code: 'code-1' },
    ];
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(() => Promise.resolve(json(states.shift())));

    const promise = pollUntilApproved(ISSUER, 'r1');
    await vi.advanceTimersByTimeAsync(0);
    expect(fetchMock).toHaveBeenCalledTimes(1); // now sleeping the 2000ms interval

    __emitAppState('background');
    await vi.advanceTimersByTimeAsync(500);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    __emitAppState('active'); // wakes the sleep: the next poll happens NOW
    await vi.advanceTimersByTimeAsync(0);
    expect(fetchMock).toHaveBeenCalledTimes(2);

    await vi.advanceTimersByTimeAsync(2000);
    expect(await promise).toBe('code-1');
  });

  it('a stale return to the foreground surfaces request_expired cleanly', async () => {
    vi.useFakeTimers();
    let reachable = false;
    vi.spyOn(globalThis, 'fetch').mockImplementation(() =>
      reachable
        ? Promise.resolve(json({ status: 'expired' }))
        : Promise.reject(new TypeError('Network request failed'))
    );

    const promise = pollUntilApproved(ISSUER, 'r1', { expiresIn: 120 });
    const outcome = expect(promise).rejects.toMatchObject({
      reason: { type: 'request_expired' },
    });

    // Backgrounded and offline: a few failed polls at the normal cadence.
    __emitAppState('background');
    await vi.advanceTimersByTimeAsync(10_000);

    // The user comes back after the pairing TTL has passed.
    reachable = true;
    __emitAppState('active');
    await vi.advanceTimersByTimeAsync(10);
    await outcome;
  });

  it('gives up as request_expired when the provider stays unreachable past the deadline', async () => {
    vi.useFakeTimers();
    vi.spyOn(globalThis, 'fetch').mockImplementation(() =>
      Promise.reject(new TypeError('Network request failed'))
    );

    const promise = pollUntilApproved(ISSUER, 'r1', { expiresIn: 1 });
    const outcome = expect(promise).rejects.toMatchObject({
      reason: { type: 'request_expired' },
    });
    await vi.advanceTimersByTimeAsync(30_000);
    await outcome;
  });
});

describe('exchangeCode', () => {
  it('posts a form-encoded PKCE exchange, no secret anywhere', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(json({ id_token: 'a.b.c' }));

    const tokens = await exchangeCode(ISSUER, {
      code: 'code-1',
      code_verifier: 'v',
      client_id: 'ast_x',
    });
    expect(tokens.id_token).toBe('a.b.c');
    const call = fetchMock.mock.calls[0][1]!;
    expect((call.headers as Record<string, string>)['Content-Type']).toBe(
      'application/x-www-form-urlencoded'
    );
    const body = new URLSearchParams(call.body as string);
    expect(body.get('grant_type')).toBe('authorization_code');
    expect(body.get('code')).toBe('code-1');
    expect(body.get('client_id')).toBe('ast_x');
    expect(body.get('client_secret')).toBeNull();
  });

  it('throws OAuthFlowError with the server reason on failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      json({ error: 'invalid_grant', error_description: 'the code is not valid' }, 400)
    );
    await expect(
      exchangeCode(ISSUER, { code: 'c', code_verifier: 'v', client_id: 'a' })
    ).rejects.toBeInstanceOf(OAuthFlowError);
  });
});
