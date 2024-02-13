import type { Request } from '@edge-runtime/primitives'
import { BuildDependencies } from '../types'

export function buildToFetchEvent(dependencies: BuildDependencies) {
  return function toFetchEvent(request: Request) {
    return new dependencies.FetchEvent(request)
  }
}
