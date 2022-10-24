import type { RequestCookie } from './types'
import { parseCookieString, serialize } from './serialize'
import { cached } from './cached'

/**
 * A class for manipulating {@link Request} cookies (`Cookie` header).
 */
export class RequestCookies {
  readonly #headers: Headers

  constructor(requestHeaders: Headers) {
    this.#headers = requestHeaders
  }

  #cache = cached((header: string | null): Map<string, RequestCookie> => {
    const parsed = header ? parseCookieString(header) : new Map()
    const cached = new Map()
    for (const [name, value] of parsed) {
      cached.set(name, { name, value })
    }
    return cached
  })

  #parsed(): Map<string, RequestCookie> {
    const header = this.#headers.get('cookie')
    return this.#cache(header)
  }

  [Symbol.iterator]() {
    return this.#parsed()[Symbol.iterator]()
  }

  /**
   * The amount of cookies received from the client
   */
  get size(): number {
    return this.#parsed().size
  }

  get(...args: [name: string] | [RequestCookie]) {
    const name = typeof args[0] === 'string' ? args[0] : args[0].name
    return this.#parsed().get(name)
  }

  getAll(...args: [name: string] | [RequestCookie] | []) {
    const all = Array.from(this.#parsed())
    if (!args.length) {
      return all.map(([_, value]) => value)
    }

    const name = typeof args[0] === 'string' ? args[0] : args[0]?.name
    return all.filter(([n]) => n === name).map(([_, value]) => value)
  }

  has(name: string) {
    return this.#parsed().has(name)
  }

  set(...args: [key: string, value: string] | [options: RequestCookie]): this {
    const [name, value] =
      args.length === 1 ? [args[0].name, args[0].value] : args

    const map = this.#parsed()
    map.set(name, { name, value })

    this.#headers.set(
      'cookie',
      Array.from(map)
        .map(([_, value]) => serialize(value))
        .join('; ')
    )
    return this
  }

  /**
   * Delete the cookies matching the passed name or names in the request.
   */
  delete(
    /** Name or names of the cookies to be deleted  */
    names: string | string[]
  ): boolean | boolean[] {
    const map = this.#parsed()
    const result = !Array.isArray(names)
      ? map.delete(names)
      : names.map((name) => map.delete(name))
    this.#headers.set(
      'cookie',
      Array.from(map)
        .map(([_, value]) => serialize(value))
        .join('; ')
    )
    return result
  }

  /**
   * Delete all the cookies in the cookies in the request.
   */
  clear(): this {
    this.delete(Array.from(this.#parsed().keys()))
    return this
  }

  /**
   * Format the cookies in the request as a string for logging
   */
  [Symbol.for('edge-runtime.inspect.custom')]() {
    return `RequestCookies ${JSON.stringify(
      Object.fromEntries(this.#parsed())
    )}`
  }
}
