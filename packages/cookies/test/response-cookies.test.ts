import { createFormat } from '@edge-runtime/format'
import { ResponseCookies } from '../src/response-cookies'

it('reflect .set into `set-cookie`', async () => {
  const response = new Response()
  const cookies = new ResponseCookies(response)

  expect(cookies.getValue('foo')).toBe(undefined)
  expect(cookies.get('foo')).toEqual(undefined)

  cookies
    .set('foo', 'bar', { path: '/test' })
    .set('fooz', 'barz', { path: '/test2' })
    .set('fooHttpOnly', 'barHttpOnly', { httpOnly: true })

  expect(cookies.getValue('foo')).toBe('bar')
  expect(cookies.get('fooz')?.value).toBe('barz')
  expect(cookies.getValue('fooHttpOnly')).toBe('barHttpOnly')

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

  expect(Object.fromEntries(response.headers.entries())['set-cookie']).toBe(
    'foo=bar; Path=/test, fooz=barz; Path=/test2, fooHttpOnly=barHttpOnly; Path=/; HttpOnly'
  )
})

it('reflect .delete into `set-cookie`', async () => {
  const response = new Response()
  const cookies = new ResponseCookies(response)

  cookies.set('foo', 'bar')
  expect(Object.fromEntries(response.headers.entries())['set-cookie']).toBe(
    'foo=bar; Path=/'
  )

  expect(cookies.getValue('foo')).toBe('bar')
  expect(cookies.get('foo')).toEqual({
    name: 'foo',
    value: 'bar',
    path: '/',
  })

  cookies.set('fooz', 'barz')
  expect(Object.fromEntries(response.headers.entries())['set-cookie']).toBe(
    'foo=bar; Path=/, fooz=barz; Path=/'
  )

  expect(cookies.getValue('fooz')).toBe('barz')
  expect(cookies.get('fooz')).toEqual({
    name: 'fooz',
    value: 'barz',
    path: '/',
  })

  cookies.delete('foo')
  expect(Object.fromEntries(response.headers.entries())['set-cookie']).toBe(
    'foo=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT, fooz=barz; Path=/'
  )

  expect(cookies.getValue('foo')).toBe(undefined)
  expect(cookies.get('foo')).toEqual({
    name: 'foo',
    path: '/',
    expires: new Date(0),
  })

  cookies.delete('fooz')

  expect(Object.fromEntries(response.headers.entries())['set-cookie']).toBe(
    'foo=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT, fooz=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT'
  )

  expect(cookies.getValue('fooz')).toBe(undefined)
  expect(cookies.get('fooz')).toEqual({
    name: 'fooz',
    expires: new Date(0),
    path: '/',
  })
})

it('options are not modified', async () => {
  const options = { maxAge: 10000 }
  const response = new Response(null, {
    headers: { 'content-type': 'application/json' },
  })
  const cookies = new ResponseCookies(response)
  cookies.set('cookieName', 'cookieValue', options)
  expect(options).toEqual({ maxAge: 10000 })
})

test('formatting with @edge-runtime/format', () => {
  const response = new Response(null)
  const cookies = new ResponseCookies(response)
  cookies.set('a', '1', { httpOnly: true })
  cookies.set('b', '2', { sameSite: 'lax' })

  const format = createFormat()
  const result = format(cookies)
  expect(result).toMatchInlineSnapshot(
    `"ResponseCookies {\\"a\\":{\\"name\\":\\"a\\",\\"value\\":\\"1\\",\\"httpOnly\\":true,\\"path\\":\\"/\\"},\\"b\\":{\\"name\\":\\"b\\",\\"value\\":\\"2\\",\\"path\\":\\"/\\",\\"sameSite\\":\\"lax\\"}}"`
  )
})
