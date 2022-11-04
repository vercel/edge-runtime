import { RequestCookies } from '../src/request-cookies'
import { createFormat } from '@edge-runtime/format'

describe('input parsing', () => {
  test('empty cookie header element', () => {
    const cookies = new RequestCookies(new Headers())
    expect(cookies.get('a')).toEqual(undefined)
    expect(cookies.getAll()).toEqual([])
    expect([...cookies]).toEqual([])
  })
  test('single element', () => {
    const headers = requestHeadersWithCookies('a=1')
    const cookies = new RequestCookies(headers)
    expect(cookies.get('a')).toEqual({ name: 'a', value: '1' })
    expect(cookies.getAll()).toEqual([{ name: 'a', value: '1' }])
  })
  test('multiple elements', () => {
    const headers = requestHeadersWithCookies('a=1; b=2')
    const cookies = new RequestCookies(headers)
    expect(cookies.getAll('a')).toEqual([{ name: 'a', value: '1' }])
    expect(cookies.getAll()).toEqual([
      { name: 'a', value: '1' },
      { name: 'b', value: '2' },
    ])
  })
  test('multiple elements followed by a semicolon', () => {
    const headers = requestHeadersWithCookies('a=1; b=2;')
    const cookies = new RequestCookies(headers)
    expect(cookies.getAll()).toEqual([
      { name: 'a', value: '1' },
      { name: 'b', value: '2' },
    ])
  })
})

test('updating a cookie', () => {
  const headers = requestHeadersWithCookies('a=1; b=2')

  const cookies = new RequestCookies(headers)
  cookies.set('b', 'hello!')
  expect(cookies.getAll()).toEqual([
    { name: 'a', value: '1' },
    { name: 'b', value: 'hello!' },
  ])
})

test('deleting a cookie', () => {
  const headers = requestHeadersWithCookies('a=1; b=2')
  const cookies = new RequestCookies(headers)
  cookies.delete('b')
  expect(cookies.getAll()).toEqual([{ name: 'a', value: '1' }])
})

test('adding a cookie', () => {
  const headers = requestHeadersWithCookies('a=1; b=2')
  const cookies = new RequestCookies(headers)
  cookies.set('c', '3')
  expect(cookies.getAll()).toEqual([
    { name: 'a', value: '1' },
    { name: 'b', value: '2' },
    { name: 'c', value: '3' },
  ])
})

test('formatting with @edge-runtime/format', () => {
  const headers = requestHeadersWithCookies('a=1; b=2')
  const cookies = new RequestCookies(headers)

  const format = createFormat()
  const result = format(cookies)
  expect(result).toMatchInlineSnapshot(
    `"RequestCookies {"a":{"name":"a","value":"1"},"b":{"name":"b","value":"2"}}"`
  )
})

function requestHeadersWithCookies(cookies: string) {
  return new Headers({ cookie: cookies })
}
