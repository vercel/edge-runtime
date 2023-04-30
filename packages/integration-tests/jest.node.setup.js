process.env.JEST_ENVIRONMENT =
  typeof EdgeRuntime === 'undefined' ? 'node' : 'edge'

if (process.env.JEST_ENVIRONMENT === 'node') {
  Object.assign(globalThis, require('@edge-runtime/primitives'))
}
