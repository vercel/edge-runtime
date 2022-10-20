import { cached } from './cached'
import { type Cookie, parseSetCookieString, serialize } from './serialize'

export type CookieBag = Map<string, Cookie>

/**
 * Loose implementation of the experimental [Cookie Store API](https://wicg.github.io/cookie-store/#dictdef-cookie)
 * The main difference is `ResponseCookies` methods do not return a Promise.
 */
export class ResponseCookies {
  readonly #headers: Headers

  constructor(response: Response) {
    this.#headers = response.headers
  }

  #cache = cached(() => {
    // @ts-expect-error See https://github.com/whatwg/fetch/issues/973
    const headers = this.#headers.getAll('set-cookie')
    const map = new Map<string, Cookie>()

    for (const header of headers) {
      const parsed = parseSetCookieString(header)
      if (parsed) {
        map.set(parsed.name, parsed)
      }
    }

    return map
  })

  #parsed() {
    const allCookies = this.#headers.get('set-cookie')
    return this.#cache(allCookies)
  }

  /**
   * {@link https://wicg.github.io/cookie-store/#CookieStore-get CookieStore#get} without the Promise.
   */
  get(...args: [key: string] | [options: Cookie]): Cookie | undefined {
    const key = typeof args[0] === 'string' ? args[0] : args[0].name
    return this.#parsed().get(key)
  }
  /**
   * {@link https://wicg.github.io/cookie-store/#CookieStore-getAll CookieStore#getAll} without the Promise.
   */
  getAll(...args: [key: string] | [options: Cookie] | [undefined]): Cookie[] {
    const all = Array.from(this.#parsed().values())
    if (!args.length) {
      return all
    }

    const key = typeof args[0] === 'string' ? args[0] : args[0]?.name
    return all.filter((c) => c.name === key)
  }

  /**
   * {@link https://wicg.github.io/cookie-store/#CookieStore-set CookieStore#set} without the Promise.
   */
  set(
    ...args:
      | [key: string, value: string, cookie?: Partial<Cookie>]
      | [options: Cookie]
  ): this {
    const [name, value, cookie] =
      args.length === 1 ? [args[0].name, args[0].value, args[0]] : args
    const map = this.#parsed()
    map.set(name, normalizeCookie({ name, value, ...cookie }))
    replace(map, this.#headers)

    return this
  }

  /**
   * {@link https://wicg.github.io/cookie-store/#CookieStore-delete CookieStore#delete} without the Promise.
   */
  delete(...args: [key: string] | [options: Cookie]): this {
    const name = typeof args[0] === 'string' ? args[0] : args[0].name
    return this.set({ name, value: '', expires: new Date(0) })
  }

  // Non-spec

  /**
   * Uses {@link ResponseCookies.get} to return only the cookie value.
   */
  getValue(...args: [key: string] | [options: Cookie]): string | undefined {
    return this.get(...args)?.value
  }

  /**
   * Uses {@link ResponseCookies.delete} to invalidate all cookies matching the given name.
   * If no name is provided, all cookies are invalidated.
   */
  clear(...args: [key: string] | [options: Cookie] | [undefined]): this {
    const key = typeof args[0] === 'string' ? args[0] : args[0]?.name
    this.getAll(key).forEach((c) => this.delete(c))
    return this
  }

  [Symbol.for('edge-runtime.inspect.custom')]() {
    return `ResponseCookies ${JSON.stringify(
      Object.fromEntries(this.#parsed())
    )}`
  }
}

function replace(bag: CookieBag, headers: Headers) {
  headers.delete('set-cookie')
  for (const [, value] of bag) {
    const serialized = serialize(value)
    headers.append('set-cookie', serialized)
  }
}

function normalizeCookie(cookie: Cookie = { name: '', value: '' }) {
  if (cookie.maxAge) {
    cookie.expires = new Date(Date.now() + cookie.maxAge * 1000)
  }

  if (cookie.path === null || cookie.path === undefined) {
    cookie.path = '/'
  }

  return cookie
}
