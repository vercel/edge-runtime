import { createFormat } from '@edge-runtime/format'

const format = createFormat()
const bareError = console.error.bind(console)
const bareLog = console.log.bind(console)
const assert = console.assert.bind(console)
const time = console.time.bind(console)
const timeEnd = console.timeEnd.bind(console)
const timeLog = console.timeLog.bind(console)
const trace = console.trace.bind(console)
const error = (...args) => bareError(format(...args))
const log = (...args) => bareLog(format(...args))

const konsole = {
  assert: (assertion, ...args) => assert(assertion, format(...args)),
  count: console.count.bind(console),
  debug: log,
  dir: console.dir.bind(console),
  error: error,
  info: log,
  log: log,
  time: (...args) => time(format(...args)),
  timeEnd: (...args) => timeEnd(format(...args)),
  timeLog,
  trace,
  warn: error,
}

export { konsole as console }
