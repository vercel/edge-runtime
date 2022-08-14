import { userAgent, userAgentFromString } from '../src'

const emptyParsedUA = {
  browser: {},
  cpu: {},
  device: {},
  engine: {},
  isBot: false,
  os: {},
  ua: '',
}

describe('userAgent()', () => {
  it('accepts a request', () => {
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

  it('handles no input', () => {
    expect(userAgent()).toEqual(emptyParsedUA)
  })

  it('handles no user-agent header', () => {
    expect(userAgent(new Request('https://example.vercel.sh'))).toEqual(
      emptyParsedUA
    )
  })
})

describe('userAgentFromString()', () => {
  it('can receive a nil value', () => {
    expect(userAgentFromString(undefined)).toEqual(emptyParsedUA)
  })

  it('parses regular user-agent', () => {
    const source =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.116 Safari/537.36'
    expect(userAgentFromString(source)).toMatchObject({
      browser: {
        major: '83',
        name: 'Chrome',
        version: '83.0.4103.116',
      },
      cpu: { architecture: 'amd64' },
      engine: {
        name: 'Blink',
        version: '83.0.4103.116',
      },
      isBot: false,
      os: {
        name: 'Windows',
        version: '10',
      },
      ua: source,
    })
  })

  it('detects bots', () => {
    const source =
      'Mozilla/5.0 (Linux; Android 5.0; SM-G920A) AppleWebKit (KHTML, like Gecko) Chrome Mobile Safari (compatible; AdsBot-Google-Mobile; +http://www.google.com/mobile/adsbot.html)'
    expect(userAgentFromString(source)).toMatchObject({
      device: {
        model: 'SM-G920A',
        type: 'mobile',
        vendor: 'Samsung',
      },
      isBot: true,
      os: {
        name: 'Android',
        version: '5.0',
      },
      ua: source,
    })
  })
})
