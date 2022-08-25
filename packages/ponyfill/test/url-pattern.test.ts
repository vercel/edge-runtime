import { URLPattern } from '..'

test('URLPattern', () => {
  const urlPattern = new URLPattern('/:foo/:bar', 'https://example.com')
  const urlPatternAsType: URLPattern = urlPattern
  const result = urlPatternAsType.exec('https://example.com/1/2')
  expect(result?.pathname.groups).toEqual({
    foo: '1',
    bar: '2',
  })
})
