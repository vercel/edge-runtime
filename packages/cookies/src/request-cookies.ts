import { parseCookieString, serialize } from './serialize'
import { cached } from './cached'

/**
 * A class for manipulating {@link Request} cookies.
 */
export class RequestCookies {
  private readonly headers: Headers

  constructor(request: Request) {
    this.headers = request.headers
  }

  /**
   * Delete all the cookies in the cookies in the request
   */
  clear(): void {
    this.delete([...this.parsed().keys()])
  }

  /**
   * Format the cookies in the request as a string for logging
   */
  [Symbol.for('edge-runtime.inspect.custom')]() {
    return `RequestCookies ${JSON.stringify(Object.fromEntries(this.parsed()))}`
  }

  /**
   * The amount of cookies received from the client
   */
  get size(): number {
    return this.parsed().size
  }

  [Symbol.iterator]() {
    return this.parsed()[Symbol.iterator]()
  }

  private cache = cached((header: string | null) => {
    const parsed = header ? parseCookieString(header) : new Map()
    return parsed
  })

  private parsed(): Map<string, string> {
    const header = this.headers.get('cookie')
    return this.cache(header)
  }

  get(name: string) {
    return this.parsed().get(name)
  }

  has(name: string) {
    return this.parsed().has(name)
  }

  set(name: string, value: string): this {
    const map = this.parsed()
    map.set(name, value)
    this.headers.set(
      'cookie',
      [...map].map(([key, value]) => serialize(key, value, {})).join('; ')
    )
    return this
  }

  delete(names: string[]): boolean[]
  delete(name: string): boolean
  delete(names: string | string[]): boolean | boolean[] {
    const map = this.parsed()
    const result = !Array.isArray(names)
      ? map.delete(names)
      : names.map((name) => map.delete(name))
    this.headers.set(
      'cookie',
      [...map].map(([key, value]) => serialize(key, value, {})).join('; ')
    )
    return result
  }
}
