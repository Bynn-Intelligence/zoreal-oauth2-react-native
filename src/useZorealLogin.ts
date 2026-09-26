import { useCallback, useEffect, useRef, useState } from 'react';
import { Linking } from 'react-native';
import { useZorealOAuth, useZorealPairingHost } from './context';
import { runLoginFlow, type ActivePairing, type InternalFlowOptions } from './flow';
import { firstWay, isLargeFormFactor, isZorealIdInstalled, type Way } from './installed';
import { resolveIntent } from './intent';
import type { AuthCodeFlowOptions, BrowserDirectFlowOptions } from './types';

interface FlowInternals {
  /** Non-null while a pairing is in flight. */
  pairing: ActivePairing | null;
  /** True from the press until the login settles: the button holds itself busy on this. */
  busy: boolean;
}

/**
 * The React binding over runLoginFlow, shared by the hook, the button and
 * useZorealAutoLogin: holds the active pairing as state, aborts a superseded
 * or unmounted flow, reads the latest options at call time so a re-render
 * never restarts a login, and, when the provider draws the pairing, decides
 * the way in and hands every state to the dialog.
 *
 * THE WAY IN, with the SDK's dialog:
 * a forced `display` wins, a tablet or TV gets the QR, and on a phone the SDK
 * asks whether ZOREAL ID is installed first. Installed (or unknown): open it.
 * Not installed: the dialog says so and offers the store, another device, or
 * the link anyway, and no pairing is started until the person picks one.
 * Without the dialog (`pairingUI="none"`) nothing is asked and the flow does
 * what it always did, so an app drawing its own UI keeps control of that.
 */
export function useZorealFlow(options: InternalFlowOptions): {
  login: () => void;
  internals: FlowInternals;
} {
  const { clientId, issuer, locale } = useZorealOAuth();
  const host = useZorealPairingHost();
  const [pairing, setPairing] = useState<ActivePairing | null>(null);
  const [missing, setMissing] = useState(false);
  const [running, setRunning] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const installedRef = useRef<boolean | null>(null);
  const ownsHostRef = useRef(false);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  // A component unmounting mid-login must stop the poll: the provider cancels
  // over-polled requests, and an orphaned interval is exactly how one happens.
  useEffect(() => () => abortRef.current?.abort(), []);

  const run = useCallback(
    (display?: Way) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setMissing(false);
      setRunning(true);
      const opts = display ? { ...optionsRef.current, display } : optionsRef.current;
      void runLoginFlow({ clientId, issuer, locale }, opts, controller, setPairing).finally(() => {
        if (abortRef.current === controller) {
          abortRef.current = null;
          setRunning(false);
        }
      });
    },
    [clientId, issuer, locale]
  );

  const login = useCallback(() => {
    const opts = optionsRef.current;
    // No dialog, a silent re-auth, a forced display or a tablet: nothing to ask.
    if (!host || opts.prompt === 'none' || opts.display === 'qr' || opts.display === 'link' || isLargeFormFactor()) {
      run();
      return;
    }
    abortRef.current?.abort();
    setRunning(true);
    void isZorealIdInstalled().then((installed) => {
      installedRef.current = installed;
      const way = firstWay(opts.display, false, installed);
      setRunning(false);
      if (way === 'missing') setMissing(true);
      else run(way);
    });
  }, [host, run]);

  const intent = resolveIntent(options.intent, options.scope, options.acr_values);

  // Hand the current state to the provider's dialog. Only this flow's own
  // states: an idle hook next to a busy one must never clear the dialog.
  useEffect(() => {
    if (!host) return;
    if (missing) {
      ownsHostRef.current = true;
      host({
        kind: 'missing',
        intent,
        otherDevice: () => run('qr'),
        haveApp: () => run('link'),
        cancel: () => setMissing(false),
      });
      return;
    }
    if (pairing) {
      ownsHostRef.current = true;
      const phone = !isLargeFormFactor();
      host({
        kind: 'pairing',
        intent,
        pairing,
        reopen: pairing.appLink ? () => void Linking.openURL(pairing.pairUrl).catch(() => undefined) : undefined,
        otherDevice: pairing.appLink ? () => run('qr') : undefined,
        thisDevice: !pairing.appLink && phone && installedRef.current !== false ? () => run('link') : undefined,
      });
      return;
    }
    if (ownsHostRef.current) {
      ownsHostRef.current = false;
      host(null);
    }
  }, [host, missing, pairing, intent, run]);

  // Leaving the screen takes this flow's dialog with it.
  useEffect(
    () => () => {
      if (ownsHostRef.current) host?.(null);
    },
    [host]
  );

  return { login, internals: { pairing, busy: running || missing || pairing !== null } };
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
