import { createHash, randomBytes } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { base64urlDecode, base64urlEncode, utf8Decode, utf8Encode } from '../src/encoding';
import { sha256 } from '../src/sha256';

describe('base64url', () => {
  it('matches Buffer base64url for every length remainder', () => {
    for (const length of [0, 1, 2, 3, 4, 15, 16, 17, 31, 32, 33, 100]) {
      const bytes = new Uint8Array(randomBytes(length));
      expect(base64urlEncode(bytes)).toBe(Buffer.from(bytes).toString('base64url'));
      expect(Buffer.from(base64urlDecode(base64urlEncode(bytes)))).toEqual(Buffer.from(bytes));
    }
  });

  it('decodes the standard alphabet and padded input too', () => {
    const bytes = Uint8Array.from([251, 239, 190]); // encodes to characters needing + and /
    const standard = Buffer.from(bytes).toString('base64');
    expect(standard).toContain('+');
    expect(Buffer.from(base64urlDecode(standard))).toEqual(Buffer.from(bytes));
    expect(Buffer.from(base64urlDecode('AQI='))).toEqual(Buffer.from([1, 2]));
  });

  it('throws on characters outside both alphabets', () => {
    expect(() => base64urlDecode('ab!c')).toThrow(/base64url/);
  });
});

describe('utf8', () => {
  it('round-trips ASCII, accented, CJK and astral text', () => {
    for (const text of ['', 'verifier-43-chars', 'Jurgen Alander', 'Aåäö', '日本語', '\u{1f9e9} astral \u{10348}']) {
      const encoded = utf8Encode(text);
      expect(Buffer.from(encoded)).toEqual(Buffer.from(text, 'utf8'));
      expect(utf8Decode(encoded)).toBe(text);
    }
  });
});

describe('sha256 (pure TypeScript)', () => {
  it('matches node:crypto across block boundaries', () => {
    const cases = [
      new Uint8Array(0),
      utf8Encode('abc'),
      new Uint8Array(randomBytes(55)), // padding fits in one block
      new Uint8Array(randomBytes(56)), // padding forces a second block
      new Uint8Array(randomBytes(64)),
      new Uint8Array(randomBytes(65)),
      new Uint8Array(randomBytes(1000)),
    ];
    for (const data of cases) {
      const expected = createHash('sha256').update(data).digest();
      expect(Buffer.from(sha256(data))).toEqual(expected);
    }
  });
});
