import * as esbuild from 'esbuild'

await esbuild.build({
  entryPoints: ['src/worker.ts'],
  bundle: true,
  outfile: 'build/worker.js',
  format: "esm",
  platform: 'node',})