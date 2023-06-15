import { createFormat } from '@edge-runtime/format'
import createRepl from 'repl'
import { homedir } from 'os'
import { join } from 'path'

import { EdgeRuntime } from '../edge-runtime'

const [NODE_MAJOR] = process.versions.node.split('.').map((v) => Number(v))

const format = createFormat()

const writer: createRepl.REPLWriter = (output) => {
  return typeof output === 'function' ? output.toString() : format(output)
}

const repl = createRepl.start({ prompt: 'ƒ => ', writer })
repl.setupHistory(join(homedir(), '.edge_runtime_repl_history'), () => {})

Object.getOwnPropertyNames(repl.context).forEach(
  (mod) => delete repl.context[mod]
)

const runtime = new EdgeRuntime()

Object.getOwnPropertyNames(runtime.context)
  .filter((key) => !key.startsWith('__'))
  .forEach((key) =>
    Object.assign(repl.context, { [key]: runtime.context[key] })
  )

Object.defineProperty(repl.context, 'EdgeRuntime', {
  configurable: false,
  enumerable: false,
  writable: false,
  value: runtime.context.EdgeRuntime,
})

if (NODE_MAJOR < 16) {
  repl.context.util = {
    inspect: (...args: any[]) => {
      const stack = new Error().stack ?? ''
      if (!stack.includes('internal/repl/utils.js')) {
        throw new Error('util.inspect is not available in Edge Runtime')
      }

      return format(...args).replace(/\n */g, ' ')
    },
  }
}

export { repl }
