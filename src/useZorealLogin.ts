import { useCallback, useEffect, useRef, useState } from 'react';
import { useZorealOAuth } from './context';
import { runLoginFlow, type ActivePairing, type InternalFlowOptions } from './flow';
import type { AuthCodeFlowOptions, BrowserDirectFlowOptions } from './types';

interface FlowInternals {
  /** Non-null while a pairing is in flight. ZorealLoginButton renders from this. */
  pairing: ActivePairing | null;
}

/**
 * The React binding over runLoginFlow, shared by the hook and the button:
 * holds the active pairing as state, aborts a superseded or unmounted flow,
 * and reads the latest options at call time so a re-render never restarts a
 * login.
 */
export function useZorealFlow(options: InternalFlowOptions): {
  login: () => void;
  internals: FlowInternals;
} {
  const { clientId, issuer, locale } = useZorealOAuth();
  const [pairing, setPairing] = useState<ActivePairing | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  // A component unmounting mid-login must stop the poll: the provider cancels
  // over-polled requests, and an orphaned interval is exactly how one happens.
  useEffect(() => () => abortRef.current?.abort(), []);

  const login = useCallback(() => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    void runLoginFlow({ clientId, issuer, locale }, optionsRef.current, controller, setPairing);
  }, [clientId, issuer, locale]);

  return { login, internals: { pairing } };
}

export function useZorealLogin(
  options: { flow?: 'browser-direct' } & BrowserDirectFlowOptions
): () => void;
export function useZorealLogin(options: { flow: 'auth-code' } & AuthCodeFlowOptions): () => void;
export function useZorealLogin(
  options: ({ flow?: 'browser-direct' | 'auth-code' } & Omit<
    BrowserDirectFlowOptions,
    'onSuccess'
  >) &
    Partial<Pick<AuthCodeFlowOptions, 'redirect_uri'>> & {
      onSuccess?: (response: never) => void;
    }
): () => void {
  const flow = options.flow ?? 'browser-direct';
  return useZorealFlow({
    ...options,
    flow,
    onCredential:
      flow === 'browser-direct'
        ? (options.onSuccess as unknown as InternalFlowOptions['onCredential'])
        : undefined,
    onCode:
      flow === 'auth-code'
        ? (options.onSuccess as unknown as InternalFlowOptions['onCode'])
        : undefined,
  }).login;
}
