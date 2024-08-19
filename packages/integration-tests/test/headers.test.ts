import { aboveNode16, guard, isEdgeRuntime } from './test-if'

guard(it, aboveNode16)('sets header calling Headers constructor', async () => {
  const headers = new Headers({ cookie: 'hello=world' })
  expect(headers.get('cookie')).toBe('hello=world')
})

guard(it, aboveNode16)('sets header calling Headers constructor', async () => {
  const headers = new Headers()
  headers.set('cookie', 'hello=world')
  expect(headers.get('cookie')).toBe('hello=world')
})

guard(it, aboveNode16)('multiple headers', async () => {
  const headers = new Headers()
  headers.append('set-cookie', 'foo=chocochip')
  headers.append('set-cookie', 'bar=chocochip')
  expect(headers.get('set-cookie')).toBe('foo=chocochip, bar=chocochip')
  expect([...headers]).toEqual([
    ['set-cookie', 'foo=chocochip'],
    ['set-cookie', 'bar=chocochip'],
  ])
})

guard(describe, isEdgeRuntime())('getAll', () => {
  test('on set-cookie', () => {
    const headers = new Headers()
    headers.append('set-cookie', 'a=1')
    headers.append('set-cookie', 'b=2')
    expect(headers.getSetCookie()).toEqual(['a=1', 'b=2'])
    expect(headers.getAll?.('set-cookie')).toEqual(['a=1', 'b=2'])
  })

  test('on any other name', () => {
    const headers = new Headers()
    expect(() => headers.getAll?.('other')).toThrow(/getAll can only be used/)
  })
})

describe('iterators', () => {
  const generate = () => {
    const headers = new Headers()
    headers.append('a', '1')
    headers.append('b', '2')
    headers.append('set-cookie', 'c=3')
    headers.append('set-cookie', 'd=4')
    return headers
  }

  test('#Symbol.iterator', () => {
    const entries = [...generate()]
    expect(entries).toEqual([
      ['a', '1'],
      ['b', '2'],
      ['set-cookie', 'c=3'],
      ['set-cookie', 'd=4'],
    ])
  })

  test('#entries', () => {
    const entries = [...generate().entries()]
    expect(entries).toEqual([
      ['a', '1'],
      ['b', '2'],
      ['set-cookie', 'c=3'],
      ['set-cookie', 'd=4'],
    ])
  })

  test('#values', () => {
    const values = [...generate().values()]
    expect(values).toEqual(['1', '2', 'c=3', 'd=4'])
  })
})
