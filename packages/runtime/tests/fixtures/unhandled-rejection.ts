import { EdgeRuntime, runServer } from '../../src'
import assert from 'assert'
import fetch from 'node-fetch'

async function main() {
  const runtime = new EdgeRuntime()
  function waitForReject() {
    return new Promise<PromiseRejectionEvent>((resolve) => {
      runtime.context.handleRejection = (event: PromiseRejectionEvent) => {
        resolve(event)
      }
    })
  }

  runtime.evaluate(`
    addEventListener('fetch', event => {
      const url = new URL(event.request.url)
      const chunk = url.searchParams.get('chunk')
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('hi there'));
          controller.enqueue(JSON.parse(chunk));
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

  const chunks = [1, 'String', true, { b: 1 }, [1], Buffer.from('Buffer')]

  try {
    for (const chunk of chunks) {
      const deferred = waitForReject()
      const url = new URL(`${server.url}?chunk=${JSON.stringify(chunk)}`)
      const response = await fetch(String(url))
      assert.strictEqual(response.status, 200)
      assert.strictEqual(await response.text(), 'hi there')
      const event = await deferred
      assert.strictEqual(
        event.reason.message,
        'This ReadableStream did not return bytes.'
      )
    }
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
