import { EdgeVM } from '../../src/edge-vm'

new EdgeVM()
Promise.reject(new Error('intentional break'))
