// run with ts-node
import { build } from 'esbuild'
import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const fixtureFolder = join(__dirname, '../test/fixtures')
const resultExtension = '.out.js'

async function transpileAll() {
  for (const file of await readdir(fixtureFolder)) {
    if (!file.endsWith(resultExtension)) {
      await transpileFile(file)
    }
  }
}

async function transpileFile(file: string) {
  const filePath = join(fixtureFolder, file)
  await build({
    entryPoints: [filePath],
    bundle: true,
    outfile: filePath.replace(/\..+$/, resultExtension),
  })
}

transpileAll()
  .then(() => process.exit(0))
  .catch((error) => {
    console.log('Errored', error)
    process.exit(1)
  })
