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

test('append works for "set-cookie"', function () {
  const headers = new Headers()
  headers.append('set-cookie', 'foo=bar')
  headers.append('set-cookie', 'fizz=buzz')
  const list = [...headers]
  expect(list).toEqual([
    ['set-cookie', 'foo=bar'],
    ['set-cookie', 'fizz=buzz'],
  ])
})
