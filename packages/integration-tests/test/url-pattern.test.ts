/**
 * URLPattern is missing in Node.js
 * TODO: remove this when this issue is addressed
 * https://github.com/nodejs/node/issues/40844
 */
if (!globalThis.URLPattern) {
  globalThis.URLPattern = require('@edge-runtime/ponyfill').URLPattern
}

test('URLPattern', () => {
  const urlPattern = new URLPattern('/:foo/:bar', 'https://example.vercel.sh')
  const urlPatternAsType: URLPattern = urlPattern
  const result = urlPatternAsType.exec('https://example.vercel.sh/1/2')
  expect(result?.pathname.groups).toEqual({
    foo: '1',
    bar: '2',
  })
})
