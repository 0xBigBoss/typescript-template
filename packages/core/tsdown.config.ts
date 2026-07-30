import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['./src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  // Mirror the src file structure rather than bundling: consumers get
  // finer-grained tree-shaking and stack traces that point at real files.
  unbundle: true,
})
