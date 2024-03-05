import { createFormat } from '@edge-runtime/format'
import { ResponseCookies } from '../src/response-cookies'

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
    .set('fooSameSite', 'barSameSite', {
      sameSite: 'none',
      partitioned: true,
      secure: true,
    })

  expect(cookies.get('foo')?.value).toBe('bar')
  expect(cookies.get('fooz')?.value).toBe('barz')
  expect(cookies.get('fooHttpOnly')?.value).toBe('barHttpOnly')
  expect(cookies.get('fooExpires')?.value).toBe('barExpires')
  expect(cookies.get('fooExpiresDate')?.value).toBe('barExpiresDate')
  expect(cookies.get('fooMaxAge')?.value).toBe('')
  expect(cookies.get('fooSameSite')?.value).toBe('barSameSite')

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
  expect(cookies.get('fooSameSite')).toEqual({
    name: 'fooSameSite',
    value: 'barSameSite',
    path: '/',
    sameSite: 'none',
    secure: true,
    partitioned: true,
  })

  expect(headers.getSetCookie()).toEqual([
    'foo=bar; Path=/test',
    'fooz=barz; Path=/test2',
    'fooHttpOnly=barHttpOnly; Path=/; HttpOnly',
    'fooExpires=barExpires; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT',
    'fooExpiresDate=barExpiresDate; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT',
    'fooMaxAge=; Path=/; Max-Age=0',
    'fooSameSite=barSameSite; Path=/; Secure; SameSite=none; Partitioned',
  ])
})

it('reflect .set all options attributes into `set-cookie`', async () => {
  const headers = new Headers()
  const cookies = new ResponseCookies(headers)
  cookies.set('first-name', 'first-value', {
    domain: 'custom-domain',
    path: 'custom-path',
    secure: true,
    sameSite: 'strict',
    expires: new Date(0),
    httpOnly: true,
    maxAge: 0,
    priority: 'high',
    partitioned: true,
  })
  const cookiesInHeaders = headers.getSetCookie()
  expect(cookiesInHeaders).toEqual([
    'first-name=first-value; Path=custom-path; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0; Domain=custom-domain; Secure; HttpOnly; SameSite=strict; Partitioned; Priority=high',
  ])
})

describe('`set-cookie` into .get and .getAll', () => {
  test.each([
    'name=value; Partitioned; Secure; HttpOnly',
    'name=value; Secure; Partitioned; HttpOnly;',
    'name=value; Secure; HttpOnly; Partitioned',
    'name=value; HttpOnly; Partitioned; Secure;',
    'name=value; Partitioned; Secure; HttpOnly',
    'name=value; HttpOnly; Partitioned; Secure;',
  ])('parses %s header correctly', (value) => {
    const headers = new Headers()
    headers.set('set-cookie', value)
    const cookies = new ResponseCookies(headers)
    const all = cookies.getAll()

    expect(all).toHaveLength(1)
    expect(all).toContainEqual({
      name: 'name',
      value: 'value',
      httpOnly: true,
      secure: true,
      partitioned: true,
    })

    expect(cookies.get('name')).toEqual(all[0])
  })
})

test('reflect .delete into `set-cookie`', async () => {
  const headers = new Headers()
  const cookies = new ResponseCookies(headers)

  cookies.set('foo', 'bar')
  expect(headers.getSetCookie()).toEqual(['foo=bar; Path=/'])

  expect(cookies.get('foo')?.value).toBe('bar')
  expect(cookies.get('foo')).toEqual({
    name: 'foo',
    value: 'bar',
    path: '/',
  })

  cookies.set('fooz', 'barz')
  expect(headers.getSetCookie()).toEqual([
    'foo=bar; Path=/',
    'fooz=barz; Path=/',
  ])

  expect(cookies.get('fooz')?.value).toBe('barz')
  expect(cookies.get('fooz')).toEqual({
    name: 'fooz',
    value: 'barz',
    path: '/',
  })

  cookies.delete('foo')
  expect(headers.getSetCookie()).toEqual([
    'foo=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT',
    'fooz=barz; Path=/',
  ])

  expect(cookies.get('foo')).toEqual({
    name: 'foo',
    path: '/',
    value: '',
    expires: new Date(0),
  })

  cookies.delete('fooz')

  expect(headers.getSetCookie()).toEqual([
    'foo=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT',
    'fooz=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT',
  ])

  expect(cookies.get('fooz')).toEqual({
    name: 'fooz',
    expires: new Date(0),
    value: '',
    path: '/',
  })
})

test('delete cookie with domain and path', async () => {
  const headers = new Headers()
  const cookies = new ResponseCookies(headers)

  cookies.delete({ name: 'foo', domain: 'example.com' })
  expect(headers.getSetCookie()).toEqual([
    'foo=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Domain=example.com',
  ])

  cookies.delete({ name: 'bar', path: '/bar' })
  expect(headers.getSetCookie()).toEqual([
    'foo=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Domain=example.com',
    'bar=; Path=/bar; Expires=Thu, 01 Jan 1970 00:00:00 GMT',
  ])

  cookies.delete({ name: 'baz', path: '/bar', domain: 'example.com' })
  expect(headers.getSetCookie()).toEqual([
    'foo=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Domain=example.com',
    'bar=; Path=/bar; Expires=Thu, 01 Jan 1970 00:00:00 GMT',
    'baz=; Path=/bar; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Domain=example.com',
  ])
})

test('options are not modified', async () => {
  const options = { maxAge: 10000 }
  const headers = new Headers({ 'content-type': 'application/json' })
  const cookies = new ResponseCookies(headers)
  cookies.set('cookieName', 'cookieValue', options)
  expect(options).toEqual({ maxAge: 10000 })
})

test('cookies.has()', () => {
  const headers = new Headers()
  const cookies = new ResponseCookies(headers)
  cookies.set('foo', 'bar')
  expect(cookies.has('foo')).toBe(true)
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
    `"ResponseCookies {"a":{"name":"a","value":"1","httpOnly":true,"path":"/"},"b":{"name":"b","value":"2","sameSite":"lax","path":"/"}}"`,
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
