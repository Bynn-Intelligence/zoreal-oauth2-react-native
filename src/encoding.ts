/**
 * Byte and text encoding, in plain TypeScript.
 *
 * React Native's JavaScript runtimes do not reliably provide btoa, atob,
 * TextEncoder or TextDecoder, and this package takes no dependency and no
 * native module. The three routines below are the whole need: base64url for
 * PKCE values and JWT payloads, UTF-8 both ways for hashing and for reading
 * claims.
 */

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

const REVERSE: Record<string, number> = {};
for (let i = 0; i < ALPHABET.length; i++) REVERSE[ALPHABET[i]] = i;
// Accept the standard alphabet too, so a base64-encoded segment that reaches
// the decoder by mistake still decodes rather than throwing on '+' or '/'.
REVERSE['+'] = 62;
REVERSE['/'] = 63;

export function base64urlEncode(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i];
    const has1 = i + 1 < bytes.length;
    const has2 = i + 2 < bytes.length;
    const b1 = has1 ? bytes[i + 1] : 0;
    const b2 = has2 ? bytes[i + 2] : 0;
    out += ALPHABET[b0 >> 2];
    out += ALPHABET[((b0 & 0x03) << 4) | (b1 >> 4)];
    if (has1) out += ALPHABET[((b1 & 0x0f) << 2) | (b2 >> 6)];
    if (has2) out += ALPHABET[b2 & 0x3f];
  }
  return out;
}

export function base64urlDecode(input: string): Uint8Array {
  const clean = input.replace(/=+$/, '');
  if (clean.length % 4 === 1) throw new Error('invalid base64url input');
  const digit = (i: number): number => {
    const value = REVERSE[clean[i]];
    if (value === undefined) throw new Error('invalid base64url input');
    return value;
  };
  const out = new Uint8Array(Math.floor((clean.length * 3) / 4));
  let o = 0;
  for (let i = 0; i < clean.length; i += 4) {
    const n0 = digit(i);
    const n1 = digit(i + 1);
    out[o++] = (n0 << 2) | (n1 >> 4);
    if (i + 2 < clean.length) {
      const n2 = digit(i + 2);
      out[o++] = ((n1 & 0x0f) << 4) | (n2 >> 2);
      if (i + 3 < clean.length) {
        out[o++] = ((n2 & 0x03) << 6) | digit(i + 3);
      }
    }
  }
  return out;
}

export function utf8Encode(text: string): Uint8Array {
  const out: number[] = [];
  for (let i = 0; i < text.length; i++) {
    const cp = text.codePointAt(i) as number;
    if (cp > 0xffff) i++; // surrogate pair consumed two UTF-16 units
    if (cp < 0x80) {
      out.push(cp);
    } else if (cp < 0x800) {
      out.push(0xc0 | (cp >> 6), 0x80 | (cp & 0x3f));
    } else if (cp < 0x10000) {
      out.push(0xe0 | (cp >> 12), 0x80 | ((cp >> 6) & 0x3f), 0x80 | (cp & 0x3f));
    } else {
      out.push(
        0xf0 | (cp >> 18),
        0x80 | ((cp >> 12) & 0x3f),
        0x80 | ((cp >> 6) & 0x3f),
        0x80 | (cp & 0x3f)
      );
    }
  }
  return Uint8Array.from(out);
}

export function utf8Decode(bytes: Uint8Array): string {
  let out = '';
  let i = 0;
  while (i < bytes.length) {
    const b0 = bytes[i++];
    let cp: number;
    if (b0 < 0x80) {
      cp = b0;
    } else if ((b0 & 0xe0) === 0xc0) {
      cp = ((b0 & 0x1f) << 6) | (bytes[i++] & 0x3f);
    } else if ((b0 & 0xf0) === 0xe0) {
      cp = ((b0 & 0x0f) << 12) | ((bytes[i++] & 0x3f) << 6) | (bytes[i++] & 0x3f);
    } else {
      cp =
        ((b0 & 0x07) << 18) |
        ((bytes[i++] & 0x3f) << 12) |
        ((bytes[i++] & 0x3f) << 6) |
        (bytes[i++] & 0x3f);
    }
    out += String.fromCodePoint(cp);
  }
  return out;
}
