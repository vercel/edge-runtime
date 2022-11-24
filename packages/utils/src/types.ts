import type { IncomingMessage, ServerResponse } from 'http'

export type NodeHandler = (req: IncomingMessage, res: ServerResponse) => void
export type WebHandler = (
  req: Request
) => Promise<Response> | Response | null | undefined
