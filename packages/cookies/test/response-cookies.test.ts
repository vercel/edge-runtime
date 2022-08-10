/**
 * @jest-environment @edge-runtime/jest-environment
 */

import { HeaderMutatingCookies } from '../src/response-cookies'

it('reflect .set into `set-cookie`', async () => {
  const response = new Response()
  const cookies = new HeaderMutatingCookies(response)

  expect(cookies.get('foo')).toBe(undefined)
  expect(cookies.getWithOptions('foo')).toEqual({
    value: undefined,
    options: {},
  })

  cookies
    .set('foo', 'bar', { path: '/test' })
    .set('fooz', 'barz', { path: '/test2' })

  expect(cookies.get('foo')).toBe('bar')
  expect(cookies.get('fooz')).toBe('barz')

  expect(cookies.getWithOptions('foo')).toEqual({
    value: 'bar',
    options: { Path: '/test' },
  })
  expect(cookies.getWithOptions('fooz')).toEqual({
    value: 'barz',
    options: { Path: '/test2' },
  })

  expect(Object.fromEntries(response.headers.entries())['set-cookie']).toBe(
    'foo=bar; Path=/test, fooz=barz; Path=/test2'
  )
})

it('reflect .delete into `set-cookie`', async () => {
  const response = new Response()
  const cookies = new HeaderMutatingCookies(response)

  cookies.set('foo', 'bar')
  expect(Object.fromEntries(response.headers.entries())['set-cookie']).toBe(
    'foo=bar; Path=/'
  )

  expect(cookies.get('foo')).toBe('bar')
  expect(cookies.getWithOptions('foo')).toEqual({
    value: 'bar',
    options: { Path: '/' },
  })

  cookies.set('fooz', 'barz')
  expect(Object.fromEntries(response.headers.entries())['set-cookie']).toBe(
    'foo=bar; Path=/, fooz=barz; Path=/'
  )

  expect(cookies.get('fooz')).toBe('barz')
  expect(cookies.getWithOptions('fooz')).toEqual({
    value: 'barz',
    options: { Path: '/' },
  })

  const firstDelete = cookies.delete('foo')
  expect(firstDelete).toBe(true)
  expect(Object.fromEntries(response.headers.entries())['set-cookie']).toBe(
    'foo=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT, fooz=barz; Path=/'
  )

  expect(cookies.get('foo')).toBe(undefined)
  expect(cookies.getWithOptions('foo')).toEqual({
    value: undefined,
    options: {},
  })

  const secondDelete = cookies.delete('fooz')
  expect(secondDelete).toBe(true)

  expect(Object.fromEntries(response.headers.entries())['set-cookie']).toBe(
    'fooz=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT, foo=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT'
  )

  expect(cookies.get('fooz')).toBe(undefined)
  expect(cookies.getWithOptions('fooz')).toEqual({
    value: undefined,
    options: {},
  })
  expect(cookies.size).toBe(0)
})

it('reflect .clear into `set-cookie`', async () => {
  const response = new Response()
  const cookies = new HeaderMutatingCookies(response)

  cookies.clear()
  expect(Object.fromEntries(response.headers.entries())['set-cookie']).toBe(
    undefined
  )

  cookies.set('foo', 'bar')
  expect(Object.fromEntries(response.headers.entries())['set-cookie']).toBe(
    'foo=bar; Path=/'
  )

  expect(cookies.get('foo')).toBe('bar')
  expect(cookies.getWithOptions('foo')).toEqual({
    value: 'bar',
    options: { Path: '/' },
  })

  cookies.set('fooz', 'barz')
  expect(Object.fromEntries(response.headers.entries())['set-cookie']).toBe(
    'foo=bar; Path=/, fooz=barz; Path=/'
  )

  cookies.clear()
  expect(Object.fromEntries(response.headers.entries())['set-cookie']).toBe(
    'foo=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT, fooz=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT'
  )
})

it('options are not modified', async () => {
  const options = { maxAge: 10000 }
  const response = new Response(null, {
    headers: { 'content-type': 'application/json' },
  })
  const cookies = new HeaderMutatingCookies(response)
  cookies.set('cookieName', 'cookieValue', options)
  expect(options).toEqual({ maxAge: 10000 })
})
