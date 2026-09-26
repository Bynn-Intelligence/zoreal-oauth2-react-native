import { Linking, Platform } from 'react-native';

/**
 * Whether ZOREAL ID is on this device, asked before a same-device sign-in so a
 * phone without it is offered the store instead of a link that opens a web
 * page in the browser (check first, open directly, fall back
 * to another device).
 *
 * `canOpenURL` answers truthfully only for a scheme the app declares: iOS
 * needs `zorealid` in `LSApplicationQueriesSchemes`, Android 11 and later a
 * `<queries>` entry. Without the declaration both answer `false` for an
 * installed ZOREAL ID, which is why the prompt this feeds always offers "I
 * already have ZOREAL ID". The scheme is only asked about, never opened.
 *
 * Resolves `true`, `false`, or `null` when the platform would not answer.
 */
export async function isZorealIdInstalled(): Promise<boolean | null> {
  try {
    return await Linking.canOpenURL('zorealid://');
  } catch {
    return null;
  }
}

/** The ZOREAL ID store listing for this platform. */
export function zorealIdStoreUrl(): string {
  return Platform.OS === 'ios'
    ? 'https://apps.apple.com/app/id6810429003'
    : 'https://play.google.com/store/apps/details?id=com.zoreal.id';
}

/** A tablet or TV: ZOREAL ID ships for phones, so the QR is the way in there. */
export function isLargeFormFactor(): boolean {
  const platform = Platform as unknown as { isPad?: boolean; isTV?: boolean };
  return platform.isPad === true || platform.isTV === true;
}

export type Way = 'link' | 'qr';

/**
 * The first way in, before any pairing exists. A forced display wins; a
 * tablet or TV gets the QR; on a phone the answer about ZOREAL ID decides,
 * where `missing` means "ask the person" rather than any way at all.
 */
export function firstWay(
  display: 'auto' | 'qr' | 'link' | undefined,
  largeFormFactor: boolean,
  installed: boolean | null
): Way | 'missing' {
  if (display === 'qr' || display === 'link') return display;
  if (largeFormFactor) return 'qr';
  return installed === false ? 'missing' : 'link';
}
