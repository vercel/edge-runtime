import { RequestCookies } from '../src/request-cookies'
import { createFormat } from '@edge-runtime/format'

describe('input parsing', () => {
  test('single element', () => {
    const request = requestWithCookies('a=1')
    const cookies = new RequestCookies(request)
    expect([...cookies]).toEqual([['a', '1']])
  })
  test('multiple elements', () => {
    const request = requestWithCookies('a=1; b=2')
    const cookies = new RequestCookies(request)
    expect([...cookies]).toEqual([
      ['a', '1'],
      ['b', '2'],
    ])
  })
  test('multiple elements followed by a semicolon', () => {
    const request = requestWithCookies('a=1; b=2;')
    const cookies = new RequestCookies(request)
    expect([...cookies]).toEqual([
      ['a', '1'],
      ['b', '2'],
    ])
  })
})

test('updating a cookie', () => {
  const request = requestWithCookies('a=1; b=2')
  const cookies = new RequestCookies(request)
  cookies.set('b', 'hello!')
  expect([...cookies]).toEqual([
    ['a', '1'],
    ['b', 'hello!'],
  ])
})

test('deleting a cookie', () => {
  const request = requestWithCookies('a=1; b=2')
  const cookies = new RequestCookies(request)
  cookies.delete('b')
  expect([...cookies]).toEqual([['a', '1']])
})

test('adding a cookie', () => {
  const request = requestWithCookies('a=1; b=2')
  const cookies = new RequestCookies(request)
  cookies.set('c', '3')
  expect([...cookies]).toEqual([
    ['a', '1'],
    ['b', '2'],
    ['c', '3'],
  ])
})

test('formatting with @edge-runtime/format', () => {
  const request = requestWithCookies('a=1; b=2')
  const cookies = new RequestCookies(request)

  const format = createFormat()
  const result = format(cookies)
  expect(result).toMatchInlineSnapshot(
    `"RequestCookies {\\"a\\":\\"1\\",\\"b\\":\\"2\\"}"`
  )
})

function requestWithCookies(cookies: string) {
  return new Request('https://example.vercel.sh', {
    headers: {
      cookie: cookies,
    },
  })
}
