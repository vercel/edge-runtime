import primitives from '../dist'

test('sets header calling Headers constructor', async () => {
  const headers = new primitives.Headers({ cookie: 'hello=world' })
  expect(headers.get('cookie')).toBe('hello=world')
})

test('sets header calling Headers constructor', async () => {
  const headers = new primitives.Headers()
  headers.set('cookie', 'hello=world')
  expect(headers.get('cookie')).toBe('hello=world')
})
