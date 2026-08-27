/**
 * Reads claims OUT of an ID token without verifying it.
 *
 * That is not a shortcut, it is the design: this code runs on a device the
 * threat model assumes is attacker-controlled, so a signature check here
 * proves nothing to anyone. The token is verified where verification means
 * something: server-side against the JWKS. What this parser feeds is
 * convenience fields (acr on the response object) that the types document as
 * convenience, with the token staying the authority.
 */

import { base64urlDecode, utf8Decode } from './encoding';

export function unsafeClaims(idToken: string): Record<string, unknown> {
  try {
    const payload = idToken.split('.')[1] ?? '';
    return JSON.parse(utf8Decode(base64urlDecode(payload)));
  } catch {
    return {};
  }
}
