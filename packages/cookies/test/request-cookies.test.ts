import { RequestCookies } from '../src/request-cookies'
import { createFormat } from '@edge-runtime/format'
import { parseCookieString } from '../src/serialize'

describe('input parsing', () => {
  test('empty cookie header element', () => {
    const cookies = new RequestCookies(new Headers())
    expect(cookies.get('a')).toEqual(undefined)
    expect(cookies.getAll()).toEqual([])
    expect([...cookies]).toEqual([])
  })
  test('invalid element', () => {
    const headers = requestHeadersWithCookies('a=%F6')
    const cookies = new RequestCookies(headers)
    expect(cookies.get('a')).toEqual(undefined)
    expect(cookies.getAll()).toEqual([])
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

test('cookies.toString()', () => {
  const headers = requestHeadersWithCookies('a=1; b=2')
  const cookies = new RequestCookies(headers)
  cookies.set('c', '3')
  expect(cookies.toString()).toMatch('a=1; b=2; c=3')
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

function mapToCookieString(map: Map<string, string>) {
  let s = ''
  for (const [k, v] of map.entries()) {
    s += `${k}=${v};`
  }
  return s
}

describe('parse cookie string', () => {
  it('with a plain value', async () => {
    const input = new Map([['foo', 'bar']])
    const result = parseCookieString(mapToCookieString(input))
    expect(result).toEqual(input)
  })
  it('with multiple `=`', async () => {
    const input = new Map([['foo', 'bar=']])
    const result = parseCookieString(mapToCookieString(input))
    expect(result).toEqual(input)
  })
  it('with multiple plain values', async () => {
    const input = new Map([
      ['foo', 'bar'],
      ['baz', 'qux'],
    ])
    const result = parseCookieString(mapToCookieString(input))
    expect(result).toEqual(input)
  })
  it('with multiple values with `=`', async () => {
    const input = new Map([
      ['foo', 'bar=='],
      ['baz', '=qux'],
    ])
    const result = parseCookieString(mapToCookieString(input))
    expect(result).toEqual(input)
  })
})
