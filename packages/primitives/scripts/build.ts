import { basename, join, resolve } from 'path'
import { Options, build } from 'tsup'
import fs from 'fs'
import esbuild from 'esbuild'

const TARGET = 'node16.8'

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
      only: true,
    },
    splitting: false,
    target: TARGET,
    entry: filesExt
      .map((f) => f.replace(/\.(js|ts)$/, '.d.ts'))
      .map((f) => join(__dirname, '../type-definitions', f)),
    external: ['./index'],
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
      process: JSON.stringify({
        version: 'v18.20.5',
        env: {},
        versions: { node: ' 18.20.5' },
      }),
    },
    esbuildPlugins: [
      {
        name: 'alias-undici-core-request',
        setup: (build) => {
          build.onResolve({ filter: /\.\.\/core\/request\.js/ }, () => {
            return {
              path: resolve('src/patches/undici-core-request.js'),
            }
          })
        },
      },
      {
        name: 'request-host-header',
        setup: (build) => {
          build.onLoad({ filter: /web\/fetch\/index\.js/ }, async (args) => {
            const content = await fs.promises.readFile(args.path, 'utf8')
            return {
              contents: content.replace(
                "httpRequest.headersList.delete('host', true)",
                '',
              ),
            }
          })
        },
      },
      /**
       * Make sure that depdendencies between primitives are consumed
       * externally instead of being bundled.
       */
      {
        name: 'import-path',
        setup: (build) => {
          build.onResolve({ filter: /.*$/ }, ({ kind, importer, path }) => {
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

  await generateTextFiles()

  for (const file of ['load']) {
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
          2,
        ),
      )
    }
  }
}

async function generateTextFiles() {
  const loadSource = fs.promises.readFile(
    resolve(__dirname, '../dist/load.js'),
    'utf8',
  )
  const files = new Set<string>()
  const loadSourceWithPolyfills = (await loadSource).replace(
    /injectSourceCode\("(.+)"\)/g,
    (_, filename) => {
      files.add(filename)
      return `require(${JSON.stringify(`${filename}.text.js`)})`
    },
  )
  await fs.promises.writeFile(
    resolve(__dirname, '../dist/load.js'),
    loadSourceWithPolyfills,
  )
  for (const file of files) {
    const {
      outputFiles: [minified],
    } = await esbuild.build({
      entryPoints: [resolve(__dirname, '../dist', file)],
      write: false,
      minify: true,
      bundle: true,
      platform: 'node',
    })
    const contents = minified.text
    await fs.promises.writeFile(
      resolve(__dirname, '../dist', `${file}.text.js`),
      `module.exports = ${JSON.stringify(contents)}`,
    )
    // remove the original file
    await fs.promises.unlink(resolve(__dirname, '../dist', file))
  }
}

bundlePackage()
  .then(() => process.exit(0))
  .catch((error) => {
    console.log('Errored', error)
    process.exit(1)
  })
