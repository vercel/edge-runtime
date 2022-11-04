test('TextEncoder references the same global Uint8Array constructor', () => {
  expect(new TextEncoder().encode('abc')).toBeInstanceOf(Uint8Array)
})

test('allows to run fetch', async () => {
  const response = await fetch('https://example.vercel.sh')
  expect(response.status).toEqual(200)
})

test('allows to run crypto', () => {
  const array = new Uint32Array(10)
  expect(crypto.getRandomValues(array)).toHaveLength(array.length)
})

test('has EdgeRuntime global', () => {
  expect(EdgeRuntime).toEqual('edge-runtime')
})

describe('Custom matchers', () => {
  describe.only('Response matchers', () => {
    test('`expect.toHaveStatus` available', () => {
      const okResponse = new Response('OK')

      expect(okResponse).toHaveStatus(200)
      expect(okResponse).toHaveStatus('Successful')
      expect(okResponse).not.toHaveStatus(201)

      expect(
        new Response('Internal Server Error', { status: 500 })
      ).toHaveStatus('Server Error')
    })

    test('`expect.toHaveJSONBody` available', () => {
      expect(expect(new Response('Without Content-Type')).toHaveJSONBody(null))
        .rejects.toThrowErrorMatchingInlineSnapshot(`
        "[2mexpect([22m[31mreceived[39m[2m).[22mtoHaveJSONBody[2m([22m[32mexpected[39m[2m)[22m

        Expected response to have "Content-Type": [32m"application/json"[39m
        Received: [31m"text/plain;charset=UTF-8"[39m"
      `)

      const json = { foo: 'bar' }
      // @ts-expect-error See https://developer.mozilla.org/en-US/docs/Web/API/Response/json
      const response = Response.json(json)

      expect(response).toHaveJSONBody(json)
      expect(response).not.toHaveJSONBody({ foo: 'baz' })
    })

    test('`expect.toHaveTextBody` available', () => {
      expect(
        expect(new Response()).toHaveTextBody('something')
      ).rejects.toThrowErrorMatchingInlineSnapshot(
        `"expected text body '' to be 'something'"`
      )

      const response = new Response('hello world')

      expect(response).toHaveTextBody('hello world')
      expect(response).not.toHaveTextBody('foo bar')
    })
  })
})
