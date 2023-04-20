const primitives = {
  Event: require('./events').Event,
  EventTarget: require('./events').EventTarget,
  AbortController: require('./abort-controller').AbortController,
  ReadableStream: require('./streams').ReadableStream,
  TransformStream: require('./streams').TransformStream,
}

Object.defineProperty(globalThis, Symbol.for('@edge-runtime/primitives'), {
  enumerable: false,
  value: primitives,
})

module.exports = {
  ...require('./abort-controller'),
  ...require('./blob'),
  ...require('./console'),
  ...require('./crypto'),
  ...require('./encoding'),
  ...require('./events'),
  ...require('./fetch'),
  ...require('./streams'),
  ...require('./text-encoding-streams'),
  ...require('./structured-clone'),
  ...require('./url'),
}

Object.assign(primitives, module.exports)
