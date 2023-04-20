function setAndRevert(obj, target, fn) {
  const before = Object.keys(obj).map((key) => [key, target[key]])
  Object.entries(obj).forEach(([key, value]) => {
    target[key] = value
  })
  try {
    return fn()
  } finally {
    before.forEach(([key, value]) => {
      target[key] = value
    })
  }
}

setAndRevert(require('./streams'), globalThis, () => {
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
})
