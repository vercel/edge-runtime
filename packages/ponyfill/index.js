const primitives =
  typeof EdgeRuntime === 'string' ? self : require('@edge-runtime/primitives')

module.exports = primitives
