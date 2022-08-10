/**
 * @jest-environment @edge-runtime/jest-environment
 */

import { userAgent, userAgentFromString } from '../src'

test('userAgent accepts a request', () => {
  const request = new Request('https://example.vercel.sh', {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.116 Safari/537.36',
    },
  })
  const ua = userAgent(request)
  expect(ua.browser).toMatchObject({
    name: 'Chrome',
    version: '83.0.4103.116',
  })
})

test('userAgentFromString can receive a nil value', () => {
  const ua = userAgentFromString(undefined)
  expect(ua).toEqual({
    browser: {},
    cpu: {},
    device: {},
    engine: {},
    isBot: false,
    os: {},
    ua: '',
  })
})
