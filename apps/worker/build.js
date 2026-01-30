import * as esbuild from 'esbuild'
import pkg from './package.json' with { type: "json" };

await esbuild.build({
  entryPoints: ['src/worker.ts'],
  bundle: true,
  outfile: 'build/worker.js',
  format: "esm",
  sourcemap: true,
  platform: 'node',
  external: pkg._bundlerConfig?.external
})