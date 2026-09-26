import { describe, expect, it, vi } from 'vitest';
import { Linking } from 'react-native';
import { firstWay, isZorealIdInstalled } from '../src/installed';
import { resolveIntent } from '../src/intent';
import { nativeStrings, strings } from '../src/i18n';

describe('the way in', () => {
  it('a forced display wins over everything', () => {
    expect(firstWay('qr', false, true)).toBe('qr');
    expect(firstWay('link', true, false)).toBe('link');
  });
  it('a tablet or TV starts with the QR', () => {
    expect(firstWay('auto', true, true)).toBe('qr');
    expect(firstWay(undefined, true, null)).toBe('qr');
  });
  it('a phone with ZOREAL ID, or one that would not say, opens it directly', () => {
    expect(firstWay('auto', false, true)).toBe('link');
    expect(firstWay(undefined, false, null)).toBe('link');
  });
  it('a phone without ZOREAL ID asks the person, and starts nothing', () => {
    expect(firstWay('auto', false, false)).toBe('missing');
  });
});

describe('isZorealIdInstalled', () => {
  it('asks the zorealid scheme and passes the answer through', async () => {
    vi.mocked(Linking.canOpenURL).mockResolvedValueOnce(false);
    expect(await isZorealIdInstalled()).toBe(false);
    expect(vi.mocked(Linking.canOpenURL)).toHaveBeenLastCalledWith('zorealid://');
    vi.mocked(Linking.canOpenURL).mockResolvedValueOnce(true);
    expect(await isZorealIdInstalled()).toBe(true);
  });
  it('reads a platform that throws as "would not say"', async () => {
    vi.mocked(Linking.canOpenURL).mockRejectedValueOnce(new Error('not allowed to query'));
    expect(await isZorealIdInstalled()).toBeNull();
  });
});

describe('resolveIntent, as the React SDK resolves it', () => {
  it('reads the scopes and the assurance asked for', () => {
    expect(resolveIntent(undefined, 'openid', undefined)).toBe('sign-in');
    expect(resolveIntent(undefined, 'openid email profile.name', undefined)).toBe('sign-in');
    expect(resolveIntent(undefined, 'openid zoreal.age', undefined)).toBe('identify');
    expect(resolveIntent(undefined, 'openid', 'zoreal.live')).toBe('presence');
    expect(resolveIntent('identify', 'openid', undefined)).toBe('identify');
  });
});

describe('the dialog copy', () => {
  it('resolves the native strings with the same rules as the React tables', () => {
    expect(nativeStrings('en').otherDevice).toBe('Use another device');
    expect(nativeStrings('sv').otherDevice).not.toBe('Use another device');
    expect(nativeStrings('es-MX').bodyOpen).toBe(nativeStrings('es-419').bodyOpen);
    expect(nativeStrings('nb').getApp).toBe(nativeStrings('no').getApp);
    expect(nativeStrings('xx-YY')).toEqual(nativeStrings('en'));
    expect(strings('sv').buttonContinue).toBe('Fortsätt med ZOREAL');
  });
  it('carries every native string in every language, with no dashes', () => {
    for (const tag of ['sv', 'de', 'ar', 'ja', 'zh-Hans', 'zh-Hant', 'pt-BR', 'es-419', 'sr', 'he']) {
      const n = nativeStrings(tag);
      for (const value of Object.values(n)) {
        expect(value.length).toBeGreaterThan(0);
        expect(value).not.toMatch(/[\u2013\u2014]/);
        expect(value.includes('ZOREAL') || !/zoreal/i.test(value)).toBe(true);
      }
    }
  });
});
