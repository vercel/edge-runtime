global.AbortSignal =
  require('./packages/primitives/dist/abort-controller').AbortSignal

/**
 * Jest uses a VM under the covers but it is setup to look like Node.js.
 * Those globals that are missing in the VM but exist in Node.js will be
 * copied over but they can produce objects that use prototypes that do
 * not exist in the VM. This causes instanceof checks to fail.
 *
 * For example, `TextEncoder` does not exist in the VM so it gets copied
 * from Node.js, but it can produce objects that use `Uint8Array` prototype.
 * This one differs from the one in the VM so what Jest does is to copy the
 * Node.js one and override one in the VM.
 *
 * The problem is that `new Uint8Array instanceof Object` will return false
 * because the underlying object is from a different realm. To fix this we
 * can patch `instanceof` to check against both for every prototype that we
 * duplicate in the Jest Runtime.
 */
global.Object = new Proxy(Object, {
  get(target, prop, receiver) {
    if (prop === Symbol.hasInstance) {
      const ObjectConstructor = Object.getPrototypeOf(
        Object.getPrototypeOf(Uint8Array.prototype)
      ).constructor

      return function (instance) {
        return (
          instance instanceof target || instance instanceof ObjectConstructor
        )
      }
    }

    return Reflect.get(target, prop, receiver)
  },
})
