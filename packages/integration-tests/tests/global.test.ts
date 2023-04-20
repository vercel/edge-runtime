test(`EdgeRuntime is a string`, () => {
  // @ts-expect-error
  expect(EdgeRuntime).toEqual(expect.any(String))
})
