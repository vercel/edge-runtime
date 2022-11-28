import type { IncomingMessage, ServerResponse } from 'http'
import type { Request, Response } from '@edge-runtime/primitives'

export type NodeHandler = (
  req: IncomingMessage,
  res: ServerResponse
) => Promise<void> | void
export type WebHandler = (
  req: Request
) => Promise<Response> | Response | null | undefined
