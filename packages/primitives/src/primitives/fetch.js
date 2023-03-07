import { AbortController } from './abort-controller'
import { AbortSignal } from './abort-controller'

import * as FetchSymbols from 'undici/lib/fetch/symbols'
import * as ResponseModule from 'undici/lib/fetch/response'

import { fetch as fetchImpl } from 'undici/lib/fetch'
import Agent from 'undici/lib/agent'

global.AbortController = AbortController
global.AbortSignal = AbortSignal

// undici uses `process.nextTick`,
// but process APIs doesn't exist in a runtime context.
process.nextTick = setImmediate

/**
 * We also must patch the error static method since it works just like
 * redirect and we need consistency.
 */
const __error = ResponseModule.Response.error
ResponseModule.Response.error = function (...args) {
  const response = __error.call(this, ...args)
  response[FetchSymbols.kHeaders][FetchSymbols.kGuard] = 'response'
  return response
}

/**
 * A global agent to be used with every fetch request. We also define a
 * couple of globals that we can hide in the runtime for advanced use.
 */
let globalDispatcher = new Agent()

export function getGlobalDispatcher() {
  return globalDispatcher
}

export function setGlobalDispatcher(agent) {
  if (!agent || typeof agent.dispatch !== 'function') {
    throw new InvalidArgumentError('Argument agent must implement Agent')
  }
  globalDispatcher = agent
}

/**
 * Export fetch with an implementation that uses a default global dispatcher.
 * It also re-cretates a new Response object in order to allow mutations on
 * the Response headers.
 */
export async function fetch() {
  const res = await fetchImpl.apply(getGlobalDispatcher(), arguments)
  const response = new Response(res.body, res)
  Object.defineProperty(response, 'url', { value: res.url })
  return response
}

export const Response = ResponseModule.Response

export { FormData } from 'undici/lib/fetch/formdata'
export { Request } from 'undici/lib/fetch/request'
export { Headers } from 'undici/lib/fetch/headers'
export { File } from 'undici/lib/fetch/file'
