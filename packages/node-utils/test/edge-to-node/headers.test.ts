import { Headers } from '@edge-runtime/primitives'
import { toOutgoingHeaders } from '../../src'

it('handles simple header values', () => {
  expect(
    toOutgoingHeaders(
      new Headers({
        'Content-Type': 'image/jpeg',
        'X-My-Custom-Header': 'Zeke are cool',
      })
    )
  ).toEqual({
    'content-type': 'image/jpeg',
    'x-my-custom-header': 'Zeke are cool',
  })
})

it('splits set-cookie with getAll()', () => {
  const headers = new Headers({ 'set-cookie': 'value1' })
  headers.append('set-cookie', 'value2')
  headers.append('set-cookie', 'value3')
  expect(toOutgoingHeaders(headers)).toEqual({
    'set-cookie': ['value1', 'value2', 'value3'],
  })
})

it('slits set-cookie without getAll()', () => {
  const rawHeaders = {
    raw: () => ({
      'set-cookie':
        'cookie1=value1, cookie2=value2; Max-Age=1000, cookie3=value3; Domain=<domain-value>; Secure',
    }),
  }
  expect(toOutgoingHeaders(rawHeaders as unknown as Headers)).toEqual({
    'set-cookie': [
      'cookie1=value1',
      'cookie2=value2; Max-Age=1000',
      'cookie3=value3; Domain=<domain-value>; Secure',
    ],
  })
})

it('handles multiple values as single string', () => {
  const headers = new Headers({ 'x-multiple': 'value1' })
  headers.append('x-multiple', 'value2')
  headers.append('x-multiple', 'value3')
  expect(toOutgoingHeaders(headers)).toEqual({
    'x-multiple': 'value1, value2, value3',
  })
})
