import { basename, join, parse, resolve } from 'path'
import { Options, build } from 'tsup'
import alias from 'esbuild-plugin-alias'
import fs from 'fs'

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
    ...BUNDLE_OPTIONS,
    entryPoints,
    outDir: outdir,
    minify: false,
    target: ['node12.22'],
    esbuildOptions(opts, _context) {
      opts.legalComments = 'external'
    },
    esbuildPlugins: [
      alias({
        buffer: resolve('src/patches/buffer.js'),
        http: resolve('src/patches/http.js'),
        'util/types': resolve('src/patches/util-types.js'),
      }),
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
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.log('Errored', error)
    process.exit(1)
  })
