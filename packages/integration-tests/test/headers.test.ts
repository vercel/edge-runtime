import { Headers } from '@edge-runtime/ponyfill'

test('sets header calling Headers constructor', async () => {
  const headers = new Headers({ cookie: 'hello=world' })
  expect(headers.get('cookie')).toBe('hello=world')
})

test('sets header calling Headers constructor', async () => {
  const headers = new Headers()
  headers.set('cookie', 'hello=world')
  expect(headers.get('cookie')).toBe('hello=world')
})

test('multiple headers', async () => {
  const headers = new Headers()
  headers.append('set-cookie', 'foo=chocochip')
  headers.append('set-cookie', 'bar=chocochip')
  expect(headers.get('set-cookie')).toBe('foo=chocochip, bar=chocochip')
  expect([...headers]).toEqual([['set-cookie', 'foo=chocochip, bar=chocochip']])
})
