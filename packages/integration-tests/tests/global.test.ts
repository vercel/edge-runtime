const maybeTest = process.env.JEST_ENVIRONMENT === 'node' ? test.skip : test

maybeTest(`EdgeRuntime is a string`, () => {
  // @ts-expect-error
  expect(EdgeRuntime).toEqual(expect.any(String))
})
