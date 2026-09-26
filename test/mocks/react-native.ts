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
  canOpenURL: vi.fn(async (_url: string): Promise<boolean> => true),
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

// Host components for the UI tests: react-test-renderer renders a string type
// as a host element, so the tree can be walked by type and props without a
// native runtime. Nothing here draws.
export const View = 'View';
export const Text = 'Text';
export const Pressable = 'Pressable';
export const Modal = 'Modal';
export const ScrollView = 'ScrollView';
export const ActivityIndicator = 'ActivityIndicator';

export const StyleSheet = {
  create: <T,>(styles: T): T => styles,
  flatten: (style: unknown): unknown => style,
  absoluteFill: {},
  absoluteFillObject: {},
  hairlineWidth: 1,
};

export function useColorScheme(): 'light' | 'dark' {
  return 'light';
}
