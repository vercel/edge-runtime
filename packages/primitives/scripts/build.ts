import alias from 'esbuild-plugin-alias'
import path from 'path'
import fs from 'fs'
import { Options, build } from 'tsup'

const BUNDLE_OPTIONS: Options = {
  bundle: true,
  keepNames: true,
  format: ['cjs'],
  platform: 'node',
}

async function bundlePackage() {
  const outdir = path.resolve(__dirname, '../dist')

  await fs.promises.mkdir(outdir).catch(() => {})

  await build({
    ...BUNDLE_OPTIONS,
    entryPoints: [path.resolve(__dirname, '../src/index.js')],
    dts: { resolve: [/.*/] },
    outDir: outdir,
    minify: false,
    target: ['node12.22'],
    esbuildOptions(opts, _context) {
      opts.legalComments = 'external'
    },
    esbuildPlugins: [
      alias({
        buffer: path.resolve('src/polyfills/buffer.js'),
        http: path.resolve('src/polyfills/http.js'),
        'util/types': path.resolve('src/polyfills/util-types.js'),
        'stream/web': path.resolve('src/polyfills/web-streams.js'),
      }),
    ],
  })
}

bundlePackage()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.log('Errored', error)
    process.exit(1)
  })
