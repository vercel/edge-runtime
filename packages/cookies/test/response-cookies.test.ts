import { createFormat } from '@edge-runtime/format'
import { ResponseCookies } from '../src/response-cookies'
import { parseCookieString } from '../src/serialize'

test('reflect .set into `set-cookie`', async () => {
  const headers = new Headers()
  const cookies = new ResponseCookies(headers)

  expect(cookies.get('foo')?.value).toBe(undefined)
  expect(cookies.get('foo')).toEqual(undefined)

  cookies
    .set('foo', 'bar', { path: '/test' })
    .set('fooz', 'barz', { path: '/test2' })
    .set('fooHttpOnly', 'barHttpOnly', { httpOnly: true })
    .set('fooExpires', 'barExpires', { expires: 0 })
    .set('fooExpiresDate', 'barExpiresDate', { expires: new Date(0) })
    .set('fooMaxAge', '', { maxAge: 0 })

  expect(cookies.get('foo')?.value).toBe('bar')
  expect(cookies.get('fooz')?.value).toBe('barz')
  expect(cookies.get('fooHttpOnly')?.value).toBe('barHttpOnly')
  expect(cookies.get('fooExpires')?.value).toBe('barExpires')
  expect(cookies.get('fooExpiresDate')?.value).toBe('barExpiresDate')
  expect(cookies.get('fooMaxAge')?.value).toBe('')

  const opt1 = cookies.get('foo')
  expect(opt1).toEqual<typeof opt1>({
    name: 'foo',
    value: 'bar',
    path: '/test',
  })
  expect(cookies.get('fooz')).toEqual({
    name: 'fooz',
    value: 'barz',
    path: '/test2',
  })
  expect(cookies.get('fooHttpOnly')).toEqual({
    name: 'fooHttpOnly',
    value: 'barHttpOnly',
    path: '/',
    httpOnly: true,
  })
  expect(cookies.get('fooExpires')).toEqual({
    name: 'fooExpires',
    value: 'barExpires',
    path: '/',
    expires: new Date(0),
  })
  expect(cookies.get('fooExpiresDate')).toEqual({
    name: 'fooExpiresDate',
    value: 'barExpiresDate',
    path: '/',
    expires: new Date(0),
  })
  expect(cookies.get('fooMaxAge')).toEqual({
    name: 'fooMaxAge',
    value: '',
    path: '/',
    maxAge: 0,
  })

  expect(Object.fromEntries(headers.entries())['set-cookie']).toBe(
    'foo=bar; Path=/test, fooz=barz; Path=/test2, fooHttpOnly=barHttpOnly; Path=/; HttpOnly, fooExpires=barExpires; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT, fooExpiresDate=barExpiresDate; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT, fooMaxAge=; Path=/; Max-Age=0'
  )
})

test('it handles set-cookie headers correctly', () => {
  const headers = new Headers()
  headers.set('set-cookie', 'secure_2=true; Secure; HttpOnly')
  const cookies = new ResponseCookies(headers)
  const all = cookies.getAll()

  expect(all).toHaveLength(1)
  expect(all[0]).toEqual({
    httpOnly: true,
    name: 'secure_2',
    secure: true,
    value: 'true',
  })

  const parsed = parseCookieString('secure_2=true; Secure; HttpOnly')
  const entries = Array.from(parsed.entries())
  expect(entries).toHaveLength(3)
  expect(entries).toContainEqual(['secure_2', 'true'])
  expect(entries).toContainEqual(['Secure', 'true'])
  expect(entries).toContainEqual(['HttpOnly', 'true'])
})

test('reflect .delete into `set-cookie`', async () => {
  const headers = new Headers()
  const cookies = new ResponseCookies(headers)

  cookies.set('foo', 'bar')
  expect(Object.fromEntries(headers.entries())['set-cookie']).toBe(
    'foo=bar; Path=/'
  )

  expect(cookies.get('foo')?.value).toBe('bar')
  expect(cookies.get('foo')).toEqual({
    name: 'foo',
    value: 'bar',
    path: '/',
  })

  cookies.set('fooz', 'barz')
  expect(Object.fromEntries(headers)['set-cookie']).toBe(
    'foo=bar; Path=/, fooz=barz; Path=/'
  )

  expect(cookies.get('fooz')?.value).toBe('barz')
  expect(cookies.get('fooz')).toEqual({
    name: 'fooz',
    value: 'barz',
    path: '/',
  })

  cookies.delete('foo')
  expect(Object.fromEntries(headers.entries())['set-cookie']).toBe(
    'foo=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT, fooz=barz; Path=/'
  )

  expect(cookies.get('foo')).toEqual({
    name: 'foo',
    path: '/',
    value: '',
    expires: new Date(0),
  })

  cookies.delete('fooz')

  expect(Object.fromEntries(headers.entries())['set-cookie']).toBe(
    'foo=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT, fooz=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT'
  )

  expect(cookies.get('fooz')).toEqual({
    name: 'fooz',
    expires: new Date(0),
    value: '',
    path: '/',
  })
})

test('options are not modified', async () => {
  const options = { maxAge: 10000 }
  const headers = new Headers({ 'content-type': 'application/json' })
  const cookies = new ResponseCookies(headers)
  cookies.set('cookieName', 'cookieValue', options)
  expect(options).toEqual({ maxAge: 10000 })
})

test('cookies.toString()', () => {
  const cookies = new ResponseCookies(new Headers())
  cookies.set({
    name: 'foo',
    value: 'bar',
    path: '/test',
  })
  cookies.set('fooz', 'barz')
  expect(cookies.toString()).toMatch('foo=bar; Path=/test; fooz=barz; Path=/')
})

test('formatting with @edge-runtime/format', () => {
  const headers = new Headers()
  const cookies = new ResponseCookies(headers)
  cookies.set('a', '1', { httpOnly: true })
  cookies.set('b', '2', { sameSite: 'lax' })

  const format = createFormat()
  const result = format(cookies)
  expect(result).toMatchInlineSnapshot(
    `"ResponseCookies {"a":{"name":"a","value":"1","httpOnly":true,"path":"/"},"b":{"name":"b","value":"2","sameSite":"lax","path":"/"}}"`
  )
})

test('splitting multiple set-cookie', () => {
  const headers = new Headers()
  headers.set('set-cookie', 'foo=bar')
  headers.append('set-cookie', 'fooz=barz')
  const cookies = new ResponseCookies(headers)
  expect(cookies.get('foo')?.value).toBe('bar')
  expect(cookies.get('fooz')?.value).toBe('barz')

  const headers2 = new Headers({ 'set-cookie': 'foo=bar' })
  headers2.set('set-cookie', 'fooz=barz') // override on purpose
  const cookies2 = new ResponseCookies(headers2)
  expect(cookies2.get('foo')?.value).toBe(undefined)
  expect(cookies2.get('fooz')?.value).toBe('barz')
})
