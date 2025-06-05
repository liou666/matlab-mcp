import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts', 'src/server.ts', 'src/handler.ts'],
  format: ['esm'],
  outDir: 'build',
  target: 'es2020',
  platform: 'node',
  sourcemap: false,
  dts: true,
  clean: true,
  minify: true,
  treeshake: true,
  banner: {
    js: '#!/usr/bin/env node',
  },
})
