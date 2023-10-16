import { createFormat } from '@edge-runtime/format'
import createRepl from 'repl'
import { homedir } from 'os'
import { join } from 'path'

import { EdgeRuntime } from '../edge-runtime'

const format = createFormat()

const writer: createRepl.REPLWriter = (output) => {
  return typeof output === 'function' ? output.toString() : format(output)
}

const repl = createRepl.start({ prompt: 'ƒ => ', writer })
repl.setupHistory(join(homedir(), '.edge_runtime_repl_history'), () => {})

Object.getOwnPropertyNames(repl.context).forEach(
  (mod) => delete repl.context[mod],
)

const runtime = new EdgeRuntime()

Object.getOwnPropertyNames(runtime.context)
  .filter((key) => !key.startsWith('__'))
  .forEach((key) =>
    Object.assign(repl.context, { [key]: runtime.context[key] }),
  )

Object.defineProperty(repl.context, 'EdgeRuntime', {
  configurable: false,
  enumerable: false,
  writable: false,
  value: runtime.context.EdgeRuntime,
})

export { repl }
