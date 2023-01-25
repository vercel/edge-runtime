import type { IncomingMessage, ServerResponse } from 'http'
import type {
  Request,
  Response,
  Headers,
  ReadableStream,
} from '@edge-runtime/primitives'
export interface BuildDependencies {
  Headers: typeof Headers
  ReadableStream: typeof ReadableStream
  Request: typeof Request
  Uint8Array: typeof Uint8Array
}

export interface RequestOptions {
  defaultOrigin: string
}

export type NodeHandler = (
  req: IncomingMessage,
  res: ServerResponse
) => Promise<void> | void

export type WebHandler = (
  req: Request
) => Promise<Response> | Response | null | undefined
