import type { Request } from '@edge-runtime/primitives'
import { BuildDependencies } from '../types'

export function buildToFetchEvent(dependencies: BuildDependencies) {
  return function toFetchEvent(request: Request) {
    const event = new dependencies.FetchEvent(request)
    Object.defineProperty(event, 'waitUntil', {
      configurable: false,
      enumerable: true,
      get: () => {
        throw new Error('waitUntil is not supported yet.')
      },
    })
    return event
  }
}
