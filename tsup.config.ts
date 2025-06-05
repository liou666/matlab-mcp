import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts', 'src/server.ts', 'src/handler.ts'],
  format: ['esm'],
  outDir: 'build',
  target: 'es2020',
  platform: 'node',
  sourcemap: true,
  dts: true,
  clean: true,
  banner: {
    js: '#!/usr/bin/env node',
  },
})
