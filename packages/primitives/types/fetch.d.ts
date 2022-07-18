export class Headers extends globalThis.Headers {
  getAll(key: 'set-cookie'): string[]
}

export class Request extends globalThis.Request {
  readonly headers: Headers
}

export class Response extends globalThis.Response {
  readonly headers: Headers
}

export { fetch }
export { File }
export { FormData }
