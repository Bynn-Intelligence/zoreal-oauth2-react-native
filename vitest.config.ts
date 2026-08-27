import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      // The library imports Linking, AppState and the UI primitives from
      // 'react-native', which Node cannot parse (Flow syntax, native modules).
      // Tests run against a minimal mock of exactly the surface this package
      // touches; everything else under test is plain TypeScript over fetch.
      'react-native': new URL('./test/mocks/react-native.ts', import.meta.url).pathname,
    },
  },
  test: {
    environment: 'node',
  },
});
