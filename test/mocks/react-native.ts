/**
 * The minimal 'react-native' surface this package touches, for tests. The
 * vitest config aliases the module specifier here; production code compiles
 * against the real react-native types.
 */

import { vi } from 'vitest';

type AppStateListener = (state: string) => void;

const appStateListeners = new Set<AppStateListener>();

export const AppState = {
  currentState: 'active' as string,
  addEventListener: (_type: string, listener: AppStateListener) => {
    appStateListeners.add(listener);
    return { remove: () => appStateListeners.delete(listener) };
  },
};

/** Test hook: drive an AppState transition. */
export function __emitAppState(next: string): void {
  AppState.currentState = next;
  for (const listener of [...appStateListeners]) listener(next);
}

/** Test hook: how many change listeners are currently subscribed. */
export function __appStateListenerCount(): number {
  return appStateListeners.size;
}

export const Linking = {
  openURL: vi.fn(async (_url: string): Promise<void> => {}),
};

export const Platform: { OS: string; isPad?: boolean; isTV?: boolean } = {
  OS: 'ios',
  isPad: false,
  isTV: false,
};

/** Test hook: reshape the platform (phone, tablet, TV). */
export function __setPlatform(overrides: Partial<typeof Platform>): void {
  Object.assign(Platform, overrides);
}

// UI primitives: never rendered in these tests, present so importing the
// button module does not explode.
export const View = (_props: unknown): null => null;
export const Text = (_props: unknown): null => null;
export const Pressable = (_props: unknown): null => null;
export const StyleSheet = {
  create: <T>(styles: T): T => styles,
  flatten: (style: unknown): unknown => style,
};
