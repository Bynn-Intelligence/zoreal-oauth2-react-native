/**
 * PKCE, S256 only: mandatory for every client, confidential ones included.
 * There is no plain fallback and there must never be one; a provider seeing
 * method=plain is seeing a bug or an attack.
 *
 * Randomness comes from crypto.getRandomValues and nowhere else. A React
 * Native runtime that does not provide it (stock Hermes does not) needs the
 * react-native-get-random-values polyfill, imported once at the app's entry
 * point; when the source is missing this module throws a clear error rather
 * than falling back to a predictable generator, because a guessable PKCE
 * verifier is a stealable login.
 */

import { base64urlEncode, utf8Encode } from './encoding';
import { sha256 } from './sha256';

const VERIFIER_BYTES = 32; // 43 base64url chars, the RFC 7636 minimum length

interface SubtleLike {
  digest(algorithm: string, data: Uint8Array): Promise<ArrayBuffer>;
}

interface CryptoLike {
  getRandomValues?: (array: Uint8Array) => Uint8Array;
  subtle?: SubtleLike;
}

const cryptoSource = (): CryptoLike | undefined =>
  (globalThis as { crypto?: CryptoLike }).crypto;

function randomBytes(length: number): Uint8Array {
  const source = cryptoSource();
  if (typeof source?.getRandomValues === 'function') {
    const bytes = new Uint8Array(length);
    source.getRandomValues(bytes);
    return bytes;
  }
  throw new Error(
    '@zoreal/oauth2-react-native: crypto.getRandomValues is not available in this ' +
      "runtime. Install the 'react-native-get-random-values' polyfill and import it " +
      "once at your app's entry point (before this package). Refusing to generate " +
      'PKCE material from a non-cryptographic source.'
  );
}

export function generateVerifier(): string {
  return base64urlEncode(randomBytes(VERIFIER_BYTES));
}

export function generateState(): string {
  return base64urlEncode(randomBytes(16));
}

export async function challengeS256(verifier: string): Promise<string> {
  const data = utf8Encode(verifier);
  const subtle = cryptoSource()?.subtle;
  if (subtle && typeof subtle.digest === 'function') {
    const digest = await subtle.digest('SHA-256', data);
    return base64urlEncode(new Uint8Array(digest));
  }
  return base64urlEncode(sha256(data));
}
