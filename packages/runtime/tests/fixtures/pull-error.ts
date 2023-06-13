import { EdgeRuntime, runServer } from '../../src'
import assert from 'assert'
import fetch from 'node-fetch'

async function main() {
  const runtime = new EdgeRuntime()
  const deferred = new Promise<PromiseRejectionEvent>((resolve) => {
    runtime.context.handleRejection = (event: PromiseRejectionEvent) => {
      resolve(event)
    }
  })

  runtime.evaluate(`
    addEventListener('fetch', event => {
      const stream = new ReadableStream({
        pull(controller) {
          throw new Error('expected pull error');
        }
      });
      return event.respondWith(
        new Response(stream, {
          status: 200,
        })
      )
    })

    addEventListener('unhandledrejection', (event) => {
      globalThis.handleRejection(event)
    })
  `)

  const server = await runServer({ runtime })

  try {
    const url = new URL(server.url)
    const response = await fetch(String(url))
    assert.strictEqual(response.status, 200)
    assert.strictEqual(await response.text(), '')
    const event = await deferred
    assert.strictEqual(event.reason.message, 'expected pull error')
    return 'TEST PASSED!'
  } finally {
    await server.close()
  }
}

main()
  .then(console.log)
  .catch((error) => {
    console.log('TEST FAILED!')
    console.log(error)
  })
