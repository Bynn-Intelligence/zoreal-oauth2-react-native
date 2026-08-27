import { describe, expect, it } from 'vitest';
import { unsafeClaims } from '../src/jwt';

const b64url = (s: string) => Buffer.from(s, 'utf8').toString('base64url');

describe('unsafeClaims', () => {
  it('reads the payload without verification', () => {
    const token = `${b64url('{"alg":"ES256"}')}.${b64url('{"acr":"zoreal.device","sub":"7QK3"}')}.sig`;
    expect(unsafeClaims(token)).toEqual({ acr: 'zoreal.device', sub: '7QK3' });
  });

  it('decodes non-ASCII claim values without TextDecoder', () => {
    const payload = JSON.stringify({ name: 'Jürgen Ålander 日本' });
    const token = `${b64url('{"alg":"ES256"}')}.${b64url(payload)}.sig`;
    expect(unsafeClaims(token)).toEqual({ name: 'Jürgen Ålander 日本' });
  });

  it('returns an empty object for garbage rather than throwing', () => {
    expect(unsafeClaims('not-a-jwt')).toEqual({});
    expect(unsafeClaims('')).toEqual({});
    expect(unsafeClaims('a.!!!.c')).toEqual({});
  });
});
