const timeoutProxy = new Proxy(setTimeout, {
  apply: (target, thisArg, args) => {
    const timeout = Reflect.apply(target, thisArg, args)
    // Returns integer value of timeout ID
    return timeout[Symbol.toPrimitive]()
  },
})

export { timeoutProxy as setTimeout }
export { timeoutProxy as setInterval }
