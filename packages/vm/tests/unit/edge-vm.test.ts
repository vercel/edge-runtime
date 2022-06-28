import { EdgeVM } from '../../src'

test('preload web standard APIs', () => {
  const edgeVM = new EdgeVM()
  edgeVM.evaluate('this.headers = new Headers()')
  edgeVM.evaluate(
    "this.request = new Request('https://edge-ping.vercel.app', { headers: new Headers({ 'Content-Type': 'text/xml' }) })"
  )

  expect(edgeVM.context.headers).toBeTruthy()
  expect(edgeVM.context.request).toBeTruthy()
  expect(edgeVM.context.request.headers.get('Content-Type')).toEqual('text/xml')
})

test('interact with fetch out of vm', async () => {
  const edgeVM = new EdgeVM()
  const promise = edgeVM.evaluate<Promise<Response>>(
    "fetch('https://edge-ping.vercel.app')"
  )

  expect(promise).toBeTruthy()
  const { url, status } = await promise

  expect(url).toEqual('https://edge-ping.vercel.app/')
  expect(status).toEqual(200)
})

test('extend a web standard API', async () => {
  const edgeVM = new EdgeVM({
    extend: (context) => {
      const rawFetch = context.fetch.bind(context.fetch)
      context.fetch = async (input: RequestInfo | URL, init?: RequestInit) =>
        rawFetch(
          typeof input === 'string' && !input.startsWith('https://')
            ? `https://${input}`
            : String(input),
          init
        )

      return context
    },
  })

  const promises = await Promise.all([
    edgeVM.evaluate<Promise<Response>>("fetch('edge-ping.vercel.app')"),
    edgeVM.evaluate<Promise<Response>>(
      "globalThis.fetch('edge-ping.vercel.app')"
    ),
  ])

  promises.forEach(({ url, status }) => {
    expect(url).toEqual('https://edge-ping.vercel.app/')
    expect(status).toEqual(200)
  })
})
