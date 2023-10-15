/**
 * @jest-environment ../jest-environment/dist
 */
test('evaluate promise', () => {
  const url = 'https://vercel.com/foo/bar?one=value'
  const req = new Request(url)
  expect(req.url).toEqual(url)
})

test('parses and reconstructs the URL alone', () => {
  const url = 'https://vercel.com/foo/bar?one=value'
  const req = new Request(url)
  expect(req.url).toEqual(url)
})

test('throws when the URL is malformed', () => {
  try {
    void new Request('meeeh')
  } catch (error: any) {
    expect(error.message).toEqual('Failed to parse URL from meeeh')
  }
})

test('Request.referrer is `about:client` by default', () => {
  const request = new Request('https://example.vercel.sh')
  expect(request.referrer).toEqual('about:client')
})

test('Request.referrer can be customized', () => {
  const request = new Request('https://example.vercel.sh', {
    referrer: 'https://vercel.com/home',
  })
  expect(request.referrer).toEqual('https://vercel.com/home')
})

test('create a Request instance using second argument', () => {
  expect(
    new Request(
      'https://example.vercel.sh',
      new Request('https://example.vercel.sh', { method: 'POST' }),
    ).method,
  ).toBe('POST')
})
