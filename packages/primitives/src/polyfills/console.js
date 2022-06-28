'use strict'

const { createFormat } = require('@edge-runtime/format')

const format = createFormat()

const error = (...args) => console.error(format(...args))
const log = (...args) => console.log(format(...args))

module.exports = {
  assert: (assertion, ...args) => console.assert(assertion, format(...args)),
  count: console.count.bind(console),
  debug: log,
  dir: (...args) => console.dir(...args),
  error,
  info: log,
  log,
  time: (...args) => console.time(format(...args)),
  timeEnd: (...args) => console.timeEnd(format(...args)),
  timeLog: (...args) => console.timeLog(...args),
  trace: (...args) => console.trace(...args),
  warn: error
}
