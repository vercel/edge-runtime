const test18 = process.version.startsWith('v18.') ? test : test.skip

test18('Blob is available globally after importing the ponyfill', () => {
  const blob = Blob
  expect(blob).toBeDefined()
  require('@edge-runtime/ponyfill')
  expect(Blob).toBe(blob)
})
