const shouldExist = Boolean(process.env.EDGE_RUNTIME_EXISTS)

test(`EdgeRuntime is ${shouldExist ? 'not defined' : 'defined'}`, () => {
  expect(typeof EdgeRuntime).toBe(shouldExist ? 'string' : 'undefined')
})
