import { EdgeRuntime } from '../src'
import assert from 'assert'

async function main() {
  const runtime = new EdgeRuntime()
  const deferred = new Promise<PromiseRejectionEvent>((resolve) => {
    runtime.context.handleRejection = (event: PromiseRejectionEvent) => {
      resolve(event)
    }
  })

  runtime.evaluate(`
    addEventListener('fetch', (event) => {
      new Promise((resolve, reject) => reject(new TypeError('This is not controlled')))
      event.respondWith(new Response('hello'));
    })

    addEventListener('unhandledrejection', (event) => {
      globalThis.handleRejection(event)
    })
  `)

  const response = await runtime.dispatchFetch('https://example.com')
  const event = await deferred

  assert.strictEqual(response.status, 200)
  assert.strictEqual(event.reason.message, 'This is not controlled')
  return 'TEST PASSED!'
}

main()
  .then(console.log)
  .catch((error) => {
    console.log('TEST FAILED!')
    console.log(error)
    process.exit(1)
  })
