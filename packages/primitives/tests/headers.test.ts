import { Headers } from '../fetch'

test('sets header calling Headers constructor', async () => {
  const headers = new Headers({ cookie: 'hello=world' })
  expect(headers.get('cookie')).toBe('hello=world')
})

test('sets header calling Headers constructor', async () => {
  const headers = new Headers()
  headers.set('cookie', 'hello=world')
  expect(headers.get('cookie')).toBe('hello=world')
})
