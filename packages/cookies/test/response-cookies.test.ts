import { createFormat } from '@edge-runtime/format'
import { ResponseCookies } from '../src/response-cookies'

it('reflect .set into `set-cookie`', async () => {
  const response = new Response()
  const cookies = new ResponseCookies(response)

  expect(cookies.get('foo')).toBe(undefined)
  expect(cookies.getWithOptions('foo')).toEqual({
    value: undefined,
    options: {},
  })

  cookies
    .set('foo', 'bar', { path: '/test' })
    .set('fooz', 'barz', { path: '/test2' })
    .set('fooHttpOnly', 'barHttpOnly', { httpOnly: true })

  expect(cookies.get('foo')).toBe('bar')
  expect(cookies.get('fooz')).toBe('barz')
  expect(cookies.get('fooHttpOnly')).toBe('barHttpOnly')

  const opt1 = cookies.getWithOptions('foo')
  expect(opt1).toEqual<typeof opt1>({
    value: 'bar',
    options: { path: '/test' },
  })
  expect(cookies.getWithOptions('fooz')).toEqual({
    value: 'barz',
    options: { path: '/test2' },
  })
  expect(cookies.getWithOptions('fooHttpOnly')).toEqual({
    value: 'barHttpOnly',
    options: {
      path: '/',
      httpOnly: true,
    },
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

  expect(cookies.get('foo')).toBe('bar')
  expect(cookies.getWithOptions('foo')).toEqual({
    value: 'bar',
    options: { path: '/' },
  })

  cookies.set('fooz', 'barz')
  expect(Object.fromEntries(response.headers.entries())['set-cookie']).toBe(
    'foo=bar; Path=/, fooz=barz; Path=/'
  )

  expect(cookies.get('fooz')).toBe('barz')
  expect(cookies.getWithOptions('fooz')).toEqual({
    value: 'barz',
    options: { path: '/' },
  })

  cookies.delete('foo')
  expect(Object.fromEntries(response.headers.entries())['set-cookie']).toBe(
    'foo=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT, fooz=barz; Path=/'
  )

  expect(cookies.get('foo')).toBe('')
  expect(cookies.getWithOptions('foo')).toEqual({
    value: '',
    options: { expires: new Date(0), path: '/' },
  })

  cookies.delete('fooz')

  expect(Object.fromEntries(response.headers.entries())['set-cookie']).toBe(
    'foo=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT, fooz=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT'
  )

  expect(cookies.get('fooz')).toBe('')
  expect(cookies.getWithOptions('fooz')).toEqual({
    value: '',
    options: { expires: new Date(0), path: '/' },
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
    `"ResponseCookies {\\"a\\":{\\"value\\":\\"1\\",\\"options\\":{\\"httpOnly\\":true,\\"path\\":\\"/\\"}},\\"b\\":{\\"value\\":\\"2\\",\\"options\\":{\\"path\\":\\"/\\",\\"sameSite\\":\\"lax\\"}}}"`
  )
})
