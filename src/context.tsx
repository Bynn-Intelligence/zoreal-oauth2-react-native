import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { DEFAULT_ISSUER } from './wire';
import { PairingSheet, type HostedPairing } from './PairingSheet';
import type { PairingUI, ZorealTheme } from './types';

export interface ZorealOAuthProviderProps {
  /** From the ZOREAL dashboard: the asset ID. */
  clientId: string;
  /** Override the provider origin. Sandbox and self-hosted testing only. */
  issuer?: string;
  /**
   * BCP 47. Drives the button text, the pairing page, AND the SDK's own
   * dialog. Pass the language your app is currently showing; without it the
   * dialog follows the phone's language.
   */
  locale?: string;
  /** Colour scheme for the SDK's dialog. Defaults to following the phone. */
  theme?: ZorealTheme;
  /**
   * Who draws the pairing. Defaults to 'modal': the SDK does, in its own
   * dialog, including the check for ZOREAL ID on a phone. Set 'none' only if
   * you render your own from `onPairingStateChange`.
   */
  pairingUI?: PairingUI;
  /**
   * How long the dialog stays open before giving up and cancelling, in ms.
   * Defaults to the provider's own expiry (five minutes today); a shorter
   * value of yours wins, a longer one cannot.
   */
  pairingTimeoutMs?: number;
  children: ReactNode;
}

export interface ZorealOAuthContextProps {
  clientId: string;
  issuer: string;
  locale?: string;
}

const ZorealOAuthContext = createContext<ZorealOAuthContextProps | null>(null);

/**
 * Internal channel from the flow to the provider. The dialog has to be
 * rendered by the provider rather than by the hook, because `useZorealLogin`
 * returns a function, not an element: there is nowhere for a hook to put a
 * dialog. Null when `pairingUI` is 'none', which is also how the flow knows to
 * stay out of the way and let the caller render.
 */
const PairingHostContext = createContext<((pairing: HostedPairing | null) => void) | null>(null);

export function useZorealPairingHost() {
  return useContext(PairingHostContext);
}

export function ZorealOAuthProvider({
  clientId,
  issuer = DEFAULT_ISSUER,
  locale,
  theme = 'auto',
  pairingUI = 'modal',
  pairingTimeoutMs,
  children,
}: ZorealOAuthProviderProps) {
  const [hosted, setHosted] = useState<HostedPairing | null>(null);

  const value = useMemo(
    () => ({ clientId, issuer: issuer.replace(/\/$/, ''), locale }),
    [clientId, issuer, locale]
  );

  const host = pairingUI === 'modal' ? setHosted : null;

  return (
    <ZorealOAuthContext.Provider value={value}>
      <PairingHostContext.Provider value={host}>
        {children}
        {hosted && <PairingSheet hosted={hosted} locale={locale} theme={theme} timeoutMs={pairingTimeoutMs} />}
      </PairingHostContext.Provider>
    </ZorealOAuthContext.Provider>
  );
}

export function useZorealOAuth(): ZorealOAuthContextProps {
  const ctx = useContext(ZorealOAuthContext);
  if (!ctx) {
    throw new Error(
      'useZorealOAuth must be used inside <ZorealOAuthProvider clientId=...>. ' +
        'Wrap your app (or the part that logs in) in the provider.'
    );
  }
  return ctx;
}
