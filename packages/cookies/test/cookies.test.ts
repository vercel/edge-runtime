/**
 * @jest-environment @edge-runtime/jest-environment
 */

import { Cookies, CookieSerializeOptions } from '../src'
import { createFormat } from '@edge-runtime/format'

it('create a empty cookies bag', async () => {
  const cookies = new Cookies()
  expect(Object.entries(cookies)).toEqual([])
})

it('create a cookies bag from string', async () => {
  const cookies = new Cookies('foo=bar; equation=E%3Dmc%5E2')
  expect(Array.from(cookies.entries())).toEqual([
    ['foo', 'foo=bar; Path=/'],
    ['equation', 'equation=E%3Dmc%5E2; Path=/'],
  ])
})

it('.set', async () => {
  const cookies = new Cookies()
  cookies.set('foo', 'bar')
  expect(Array.from(cookies.entries())).toEqual([['foo', 'foo=bar; Path=/']])
})

it('.set with options', async () => {
  const cookies = new Cookies()

  const options: CookieSerializeOptions = {
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
    httpOnly: true,
    sameSite: 'strict',
    domain: 'example.com',
  }

  cookies.set('foo', 'bar', options)

  expect(options).toEqual({
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
    httpOnly: true,
    sameSite: 'strict',
    domain: 'example.com',
  })

  const [[key, value]] = Array.from(cookies.entries())
  const values = value.split('; ')

  expect(key).toBe('foo')

  expect(values).toEqual([
    'foo=bar',
    'Max-Age=604800',
    'Domain=example.com',
    'Path=/',
    expect.stringContaining('Expires='),
    'HttpOnly',
    'SameSite=Strict',
  ])
})

it('.delete', async () => {
  const cookies = new Cookies()
  cookies.set('foo', 'bar')
  cookies.delete('foo')
  expect(Array.from(cookies.entries())).toEqual([])
})

it('.has', async () => {
  const cookies = new Cookies()
  cookies.set('foo', 'bar')
  expect(cookies.has('foo')).toBe(true)
})

test('cookies formatted to log', () => {
  const cookies = new Cookies()
  cookies.set('foo', 'bar', {
    httpOnly: true,
    expires: new Date(1660132705084),
  })
  const formatter = createFormat()
  const formatted = formatter(cookies)
  expect(formatted).toEqual(
    `{ foo: 'foo=bar; Path=/; Expires=Wed, 10 Aug 2022 11:58:25 GMT; HttpOnly' }`
  )
})
