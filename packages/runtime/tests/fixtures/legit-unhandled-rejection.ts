import { EdgeRuntime } from '../../src'

new EdgeRuntime()
Promise.reject(new Error('intentional break'))
