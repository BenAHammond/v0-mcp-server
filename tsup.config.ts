import { defineConfig } from 'tsup';

export default defineConfig([
  // Library build
  {
    entry: ['src/index.ts'],
    format: ['esm'],
    dts: true,
    clean: true,
    sourcemap: true,
    minify: false,
    esbuildOptions(options) {
      options.platform = 'node';
    },
  },
  // CLI build with shebang
  {
    entry: ['src/cli/index.ts'],
    outDir: 'dist/cli',
    format: ['esm'],
    dts: true,
    sourcemap: true,
    minify: false,
    banner: {
      js: '#!/usr/bin/env node',
    },
    esbuildOptions(options) {
      options.platform = 'node';
    },
  }
]);
