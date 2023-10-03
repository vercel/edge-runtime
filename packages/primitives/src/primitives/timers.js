const setTimeoutProxy = new Proxy(setTimeout, {
  apply: (target, thisArg, args) => {
    const timeout = Reflect.apply(target, thisArg, args)
    // Returns integer value of timeout ID
    return timeout[Symbol.toPrimitive]()
  },
})

const setIntervalProxy = new Proxy(setInterval, {
  apply: (target, thisArg, args) => {
    const timeout = Reflect.apply(target, thisArg, args)
    // Returns integer value of timeout ID
    return timeout[Symbol.toPrimitive]()
  },
})

export { setTimeoutProxy as setTimeout }
export { setIntervalProxy as setInterval }
