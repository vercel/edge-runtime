import { EdgeRuntime, runServer } from '../../src'
import assert from 'assert'
import fetch from 'node-fetch'
import util from 'util'

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
        start(controller) {
          controller.enqueue(new TextEncoder().encode('hi there'));
          controller.enqueue('wrong chunk');
          controller.close();
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
    assert.strictEqual(await response.text(), 'hi there')
    const event = await deferred
    assert.strictEqual(
      event.reason.message,
      'This ReadableStream did not return bytes.'
    )
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
