export type StatusCode =
  | 100 // Continue
  | 101 // Switching protocols
  | 102 // Processing
  | 103 // Early Hints
  | 200 // OK
  | 201 // Created
  | 202 // Accepted
  | 203 // Non-Authoritative Information
  | 204 // No Content
  | 205 // Reset Content
  | 206 // Partial Content
  | 207 // Multi-Status
  | 208 // Already Reported
  | 226 // IM Used
  | 300 // Multiple Choices
  | 301 // Moved Permanently
  | 302 // Found (Previously "Moved Temporarily")
  | 303 // See Other
  | 304 // Not Modified
  | 305 // Use Proxy
  | 306 // Switch Proxy
  | 307 // Temporary Redirect
  | 308 // Permanent Redirect
  | 400 // Bad Request
  | 401 // Unauthorized
  | 402 // Payment Required
  | 403 // Forbidden
  | 404 // Not Found
  | 405 // Method Not Allowed
  | 406 // Not Acceptable
  | 407 // Proxy Authentication Required
  | 408 // Request Timeout
  | 409 // Conflict
  | 410 // Gone
  | 411 // Length Required
  | 412 // Precondition Failed
  | 413 // Payload Too Large
  | 414 // URI Too Long
  | 415 // Unsupported Media Type
  | 416 // Range Not Satisfiable
  | 417 // Expectation Failed
  | 418 // I'm a Teapot
  | 421 // Misdirected Request
  | 422 // Unprocessable Entity
  | 423 // Locked
  | 424 // Failed Dependency
  | 425 // Too Early
  | 426 // Upgrade Required
  | 428 // Precondition Required
  | 429 // Too Many Requests
  | 431 // Request Header Fields Too Large
  | 451 // Unavailable For Legal Reasons
  | 500 // Internal Server Error
  | 501 // Not Implemented
  | 502 // Bad Gateway
  | 503 // Service Unavailable
  | 504 // Gateway Timeout
  | 505 // HTTP Version Not Supported
  | 506 // Variant Also Negotiates
  | 507 // Insufficient Storage
  | 508 // Loop Detected
  | 510 // Not Extended
  | 511 // Network Authentication Required

export type Status =
  | 'Informational'
  | 'Successful'
  | 'Redirection'
  | 'Client Error'
  | 'Server Error'

/** `toHaveStatusCode` parameters */
export type StatusParams = [status: StatusCode | Status]

export type JSONType =
  | Record<string, unknown>
  | unknown[]
  | string
  | number
  | boolean
  | null

/** `toHaveJSONBody` parameters */
export type JSONBodyParams = [body: JSONType]

interface SharedMatchers<R = unknown> {
  /**
   * @see
   * [@edge-runtime/jest-environment#toHaveJSONBody](https://edge-runtime.vercel.app/packages/jest-environment#tohavejsonbody)
   */
  toHaveJSONBody(...args: JSONBodyParams): R
  /**
   * @see
   * [@edge-runtime/jest-environment#toHaveTextBody](https://edge-runtime.vercel.app/packages/jest-environment#tohavetextbody)
   */
  toHaveTextBody(body: string): R
}

export interface ResponseMatchers<R = unknown> extends SharedMatchers<R> {
  /**
   * @description
   * Assert whether a response has a specific status code or status type.
   * @example
   *
   * expect(new Response("OK", { status: 200 })).toHaveStatus(200)
   * expect(new Response("OK", { status: 200 })).toHaveStatus("Successful")
   * expect(new Response("Internal Server Error"), {status: 500}).toHaveStatus("Server Error")
   * expect(new Response("OK")).not.toHaveStatus(201)
   * @see
   * [@edge-runtime/jest-environment#toHaveStatus](https://edge-runtime.vercel.app/packages/jest-environment#tohavestatus)
   */
  toHaveStatus(...args: StatusParams): R
}

export interface RequestMatchers<R = unknown> extends SharedMatchers<R> {}

declare global {
  namespace jest {
    interface Expect extends RequestMatchers, ResponseMatchers {}
    interface Matchers<R> extends RequestMatchers<R>, ResponseMatchers<R> {}
    interface InverseAsymmetricMatchers
      extends RequestMatchers,
        ResponseMatchers {}
  }
}
