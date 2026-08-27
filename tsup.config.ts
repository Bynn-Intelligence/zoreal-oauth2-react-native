import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  // React Server Components (Expo Router is growing support): every export
  // here is client-side by nature (hooks, Linking, AppState), so the whole
  // bundle carries the directive and an integrator does not need their own
  // client boundary file. Metro treats it as an inert string.
  banner: { js: "'use client';" },
});
