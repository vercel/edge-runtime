test('TextEncoder references the same global Uint8Array constructor', () => {
  expect(new TextEncoder().encode('abc')).toBeInstanceOf(Uint8Array)
})

test('allows to run fetch', async () => {
  const response = await fetch('https://vercel.com')
  expect(response.status).toEqual(200)
})

test('allows to run crypto', async () => {
  const array = new Uint32Array(10)
  expect(crypto.getRandomValues(array)).toHaveLength(array.length)
})

test('has EdgeRuntime global', () => {
  expect(EdgeRuntime).toEqual('edge-runtime')
})

describe('Custom matchers', () => {
  test('`expect.toHaveStatus` available', () => {
    const okResponse = new Response('OK')

    expect(okResponse).toHaveStatus(200)
    expect(okResponse).toHaveStatus('Successful')
    expect(okResponse).not.toHaveStatus(201)

    expect(new Response('Internal Server Error', { status: 500 })).toHaveStatus(
      'Server Error'
    )
  })
})
