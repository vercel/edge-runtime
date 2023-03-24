import { parse } from 'acorn-loose'
import { promises as fs } from 'fs'
import { simple } from 'acorn-walk'
import { EdgeVM } from '@edge-runtime/vm'

test('exports all primitives in Edge Runtime', async () => {
  const exportedNames = await getExportedNames()

  const anyObject = exportedNames.reduce(
    (acc: Record<string, any>, name: string) => {
      acc[name] = expect.anything()
      return acc
    },
    {}
  )

  const runtime = new EdgeVM({
    codeGeneration: { strings: false, wasm: false },
  })
  const result = runtime.require(require.resolve('..'))

  for (const key of LIMBO_STATE) {
    delete anyObject[key]
    delete result[key]
  }

  expect(result).toEqual(anyObject)
})

test('exports all primitives in Node.js', async () => {
  const exportedNames = await getExportedNames()

  const anyObject = exportedNames.reduce(
    (acc: Record<string, any>, name: string) => {
      acc[name] = expect.anything()
      return acc
    },
    {}
  )

  const result = { ...require('..') }

  for (const key of LIMBO_STATE) {
    delete anyObject[key]
    delete result[key]
  }

  expect(result).toEqual(anyObject)
})

async function getExportedNames() {
  const typesPath = require.resolve('@edge-runtime/primitives/types/index.d.ts')
  const typesContents = await fs.readFile(typesPath, 'utf8')
  const ast = parse(typesContents, { ecmaVersion: 'latest' })
  const exportedNames: string[] = []
  simple(ast, {
    ExportNamedDeclaration(node: any) {
      for (const specifier of node.specifiers) {
        if (specifier.exported?.name) {
          exportedNames.push(specifier.exported.name)
        }
      }
    },
  })
  return exportedNames
}

export const LIMBO_STATE = [
  'DOMException',
  'setGlobalDispatcher',
  'getGlobalDispatcher',
  'RequestInfo',
  'RequestInit',
]
