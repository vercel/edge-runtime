import { RequestCookies } from '../src/request-cookies'
import { createFormat } from '@edge-runtime/format'

describe('input parsing', () => {
  test('single element', () => {
    const headers = requestHeadersWithCookies('a=1')
    const cookies = new RequestCookies(headers)
    expect([...cookies]).toEqual([['a', '1']])
  })
  test('multiple elements', () => {
    const headers = requestHeadersWithCookies('a=1; b=2')
    const cookies = new RequestCookies(headers)
    expect([...cookies]).toEqual([
      ['a', '1'],
      ['b', '2'],
    ])
  })
  test('multiple elements followed by a semicolon', () => {
    const headers = requestHeadersWithCookies('a=1; b=2;')
    const cookies = new RequestCookies(headers)
    expect([...cookies]).toEqual([
      ['a', '1'],
      ['b', '2'],
    ])
  })
})

test('updating a cookie', () => {
  const headers = requestHeadersWithCookies('a=1; b=2')

  const cookies = new RequestCookies(headers)
  cookies.set('b', 'hello!')
  expect([...cookies]).toEqual([
    ['a', '1'],
    ['b', 'hello!'],
  ])
})

test('deleting a cookie', () => {
  const headers = requestHeadersWithCookies('a=1; b=2')
  const cookies = new RequestCookies(headers)
  cookies.delete('b')
  expect([...cookies]).toEqual([['a', '1']])
})

test('adding a cookie', () => {
  const headers = requestHeadersWithCookies('a=1; b=2')
  const cookies = new RequestCookies(headers)
  cookies.set('c', '3')
  expect([...cookies]).toEqual([
    ['a', '1'],
    ['b', '2'],
    ['c', '3'],
  ])
})

test('formatting with @edge-runtime/format', () => {
  const headers = requestHeadersWithCookies('a=1; b=2')
  const cookies = new RequestCookies(headers)

  const format = createFormat()
  const result = format(cookies)
  expect(result).toMatchInlineSnapshot(
    `"RequestCookies {\\"a\\":\\"1\\",\\"b\\":\\"2\\"}"`
  )
})

function requestHeadersWithCookies(cookies: string) {
  return new Headers({ cookie: cookies })
}
