import { EdgeRuntime } from '../../src'
import assert from 'assert'

function main() {
  const runtime = new EdgeRuntime()
  runtime.context.handleError = (error: Error) => {
    assert.strictEqual(error?.message, 'expected error')
    console.log('TEST PASSED!')
  }

  runtime.evaluate(`
    addEventListener('error', (error) => {
      globalThis.handleError(error)
    })
    
    throw new Error('expected error')
  `)
}

main()
