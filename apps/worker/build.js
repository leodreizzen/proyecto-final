import * as esbuild from 'esbuild'

await esbuild.build({
  entryPoints: ['src/worker.ts'],
  bundle: true,
  outfile: 'worker.ts',
  format: "esm",
  platform: 'node',})