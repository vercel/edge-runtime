/**
 * @jest-environment ../jest-environment/dist
 */
test('evaluate promise', async () => {
  const url = 'https://vercel.com/foo/bar?one=value'
  const req = new Request(url)
  expect(req.url).toEqual(url)
})

test('parses and reconstructs the URL alone', async () => {
  const url = 'https://vercel.com/foo/bar?one=value'
  const req = new Request(url)
  expect(req.url).toEqual(url)
})

test('throws when the URL is malformed', async () => {
  try {
    void new Request('meeeh')
  } catch (error: any) {
    expect(error.message).toEqual('Failed to parse URL from meeeh')
  }
})

test('Request.referrer is `about:client` by default', async () => {
  const request = new Request('https://example.vercel.sh')
  expect(request.referrer).toEqual('about:client')
})

test('Request.referrer can be customized', async () => {
  const request = new Request('https://example.vercel.sh', {
    referrer: 'https://vercel.com/home',
  })
  expect(request.referrer).toEqual('https://vercel.com/home')
})
