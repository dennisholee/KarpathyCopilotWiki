#!/usr/bin/env node

const esbuild = require('esbuild');
const path = require('path');

const isProduction = process.argv.includes('--production');
const isWatch = process.argv.includes('--watch');

const baseConfig = {
  entryPoints: ['src/extension.ts'],
  bundle: true,
  platform: 'node',
  target: 'ES2020',
  external: ['vscode', 'canvas'],
  outfile: 'dist/extension.js',
  sourcemap: !isProduction,
  minify: isProduction,
  define: {
    'process.env.NODE_ENV': isProduction ? '"production"' : '"development"',
  },
  logLevel: 'info',
};

async function build() {
  try {
    if (isWatch) {
      const context = await esbuild.context(baseConfig);
      await context.watch();
      console.log('Watching for changes...');
    } else {
      await esbuild.build(baseConfig);
      console.log('Build complete!');
    }
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

build();
