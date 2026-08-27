import { afterEach, describe, expect, it, vi } from 'vitest';
import { challengeS256, generateState, generateVerifier } from '../src/pkce';

afterEach(() => vi.unstubAllGlobals());

describe('pkce', () => {
  it('produces the RFC 7636 appendix B challenge for the known verifier', async () => {
    expect(await challengeS256('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk')).toBe(
      'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM'
    );
  });

  it('produces the same challenge from the pure-TypeScript path when crypto.subtle is absent', async () => {
    const real = globalThis.crypto;
    vi.stubGlobal('crypto', {
      getRandomValues: real.getRandomValues.bind(real),
      // no subtle: the Hermes case
    });
    expect(await challengeS256('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk')).toBe(
      'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM'
    );
  });

  it('generates verifiers of RFC-valid length and charset', () => {
    for (let i = 0; i < 20; i++) {
      const v = generateVerifier();
      expect(v.length).toBeGreaterThanOrEqual(43);
      expect(v.length).toBeLessThanOrEqual(128);
      expect(v).toMatch(/^[A-Za-z0-9_-]+$/);
    }
  });

  it('never repeats state', () => {
    const seen = new Set(Array.from({ length: 100 }, generateState));
    expect(seen.size).toBe(100);
  });

  it('refuses to generate PKCE material without a cryptographic random source', () => {
    vi.stubGlobal('crypto', undefined);
    expect(() => generateVerifier()).toThrow(/getRandomValues/);
    expect(() => generateState()).toThrow(/react-native-get-random-values/);
  });
});
