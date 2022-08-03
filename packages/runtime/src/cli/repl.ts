import { createFormat } from '@edge-runtime/format'
import createRepl from 'repl'

import { EdgeRuntime } from '../edge-runtime'

const format = createFormat()

const writer: createRepl.REPLWriter = (output) => {
  return typeof output === 'function' ? output.toString() : format(output)
}

const runtime = new EdgeRuntime()
const repl = createRepl.start({
  prompt: 'ƒ => ',
  writer,
  async eval(cmd, _context, _file, cb) {
    try {
      cb(null, runtime.evaluate(cmd))
    } catch (err: any) {
      cb(err, null)
    }
  },
})

const nodeMajorVersion = parseInt(process.versions.node.split('.')[0])
if (nodeMajorVersion < 16) {
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
