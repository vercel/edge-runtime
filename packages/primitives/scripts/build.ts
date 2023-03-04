import { basename, join, parse, resolve } from 'path'
import alias from 'esbuild-plugin-alias'
import { Options, build } from 'tsup'
import fs from 'fs'

const TARGET = 'node14.6'

const BUNDLE_OPTIONS: Options = {
  bundle: true,
  keepNames: true,
  format: ['cjs'],
  platform: 'node',
}

async function bundlePackage() {
  const entryFolder = resolve(__dirname, '../src/primitives')
  const filesExt = await fs.promises.readdir(entryFolder)
  const entryPoints = filesExt.map((file) => join(entryFolder, file))
  const outdir = resolve(__dirname, '../dist')
  await fs.promises.mkdir(outdir).catch(() => {})

  await build({
    bundle: true,
    dts: {
      resolve: true,
    },
    format: [],
    target: TARGET,
    entry: filesExt
      .map((f) => f.replace(/\.(js|ts)$/, '.d.ts'))
      .map((f) => join(__dirname, '../type-definitions', f)),
    outDir: resolve(__dirname, '../types'),
  })

  for (const file of await fs.promises.readdir(join(__dirname, '../types'))) {
    const fullPath = join(__dirname, '../types', file)
    await fs.promises.rename(fullPath, fullPath.replace(/\.d\.d\.ts$/, '.d.ts'))
  }

  await build({
    ...BUNDLE_OPTIONS,
    entryPoints,
    outDir: outdir,
    minify: false,
    target: TARGET,
    esbuildOptions(opts, _context) {
      opts.legalComments = 'external'
    },
    define: {
      process: JSON.stringify({ env: {}, versions: { node: '16.6.0' } }),
    },
    esbuildPlugins: [
      // @ts-ignore
      alias({
        'util/types': resolve('src/patches/util-types.js'),
      }),
      {
        name: 'alias-undici-core-request',
        setup: (build) => {
          build.onResolve({ filter: /^\.\/core\/request$/ }, async (args) => {
            // validate it's resolved by the expected path
            if (args.importer.endsWith('node_modules/undici/lib/client.js')) {
              return {
                path: resolve('src/patches/undici-core-request.js'),
              }
            }
          })
        },
      },

      /**
       * Make sure that depdendencies between primitives are consumed
       * externally instead of being bundled. Also polyfills stream/web
       * with the web streams polyfill.
       */
      {
        name: 'import-path',
        setup: (build) => {
          build.onResolve({ filter: /.*$/ }, ({ kind, importer, path }) => {
            if (path === 'stream/web') {
              return {
                path: './streams',
                external: true,
              }
            }

            const fullpath = resolve(importer, '..', path)
            const isEntry = entryPoints.includes(`${fullpath}.js`)
            if (kind !== 'entry-point' && isEntry && path.startsWith('.')) {
              return {
                path: `./${basename(fullpath)}`,
                external: true,
              }
            }
          })
        },
      },
      /**
       * Make sure that undici has defined the FinalizationRegistry global
       * available globally which is missing in older node.js versions.
       */
      {
        name: 'add-finalization-registry',
        setup: (build) => {
          build.onLoad(
            { filter: /undici\/lib\/fetch\/request/ },
            async (args) => {
              return {
                contents: Buffer.concat([
                  Buffer.from(
                    `global.FinalizationRegistry = function () { return { register: function () {} } }`
                  ),
                  await fs.promises.readFile(args.path),
                ]),
              }
            }
          )
        },
      },
      /**
       * Modern Node.js versions include Blob globally which makes the Blob
       * polyfill fail as if it was running on the browser so we attempt to
       * remove if from `global` always.
       */
      {
        name: 'hide-builtin-blob',
        setup: (build) => {
          build.onLoad({ filter: /blob-polyfill/ }, async (args) => {
            return {
              contents: Buffer.concat([
                Buffer.from(
                  `(() => { try { global.Blob = undefined; } catch {} })(); `
                ),
                await fs.promises.readFile(args.path),
              ]),
            }
          })
        },
      },
    ],
  })

  for (const file of filesExt.map((file) => parse(file).name)) {
    if (file !== 'index') {
      await fs.promises.mkdir(resolve(__dirname, `../${file}`)).catch(() => {})
      await fs.promises.writeFile(
        resolve(__dirname, `../${file}/package.json`),
        JSON.stringify(
          {
            main: `../dist/${file}.js`,
            types: `../types/${file}.d.ts`,
          },
          null,
          2
        )
      )
    }
  }
}

bundlePackage()
  .then(() => process.exit(0))
  .catch((error) => {
    console.log('Errored', error)
    process.exit(1)
  })
