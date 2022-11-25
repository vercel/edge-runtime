import { Headers } from '@edge-runtime/primitives'
import { transformToOugoingHeaders } from '../../src'

describe('transformToOugoingHeaders()', () => {
  it('handles simple header values', () => {
    expect(
      transformToOugoingHeaders(
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

  it('handles set-cookie multiple values', () => {
    const headers = new Headers({ 'set-cookie': 'value1' })
    headers.append('set-cookie', 'value2')
    headers.append('set-cookie', 'value3')
    expect(transformToOugoingHeaders(headers)).toEqual({
      'set-cookie': ['value1', 'value2', 'value3'],
    })
  })

  it('handles multiple values as single string', () => {
    const headers = new Headers({ 'x-multiple': 'value1' })
    headers.append('x-multiple', 'value2')
    headers.append('x-multiple', 'value3')
    expect(transformToOugoingHeaders(headers)).toEqual({
      'x-multiple': 'value1, value2, value3',
    })
  })

  it('merges with existing values', () => {
    const headers = new Headers({ 'x-multiple': 'value1' })
    headers.append('x-multiple', 'value2')
    headers.set('content-type', 'text/plain')
    headers.set('content-length', '10')
    expect(
      transformToOugoingHeaders(headers, {
        'content-length': '5',
        'x-existing': 'oy!',
      })
    ).toEqual({
      'x-multiple': 'value1, value2',
      'content-type': 'text/plain',
      'content-length': '10',
      'x-existing': 'oy!',
    })
  })
})
