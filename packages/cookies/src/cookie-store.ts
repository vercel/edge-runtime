import type { CookieSerializeOptions } from 'cookie'
import { cached } from './cached'
import { parseSetCookieString, serialize } from './serialize'

/**
 * {@link https://wicg.github.io/cookie-store/#dictdef-cookielistitem CookieListItem} as specified by W3C.
 */
export interface CookieListItem
  extends Pick<
    CookieSerializeOptions,
    'domain' | 'path' | 'expires' | 'secure' | 'sameSite'
  > {
  /** A string with the name of a cookie. */
  name: string
  /** A string containing the value of the cookie. */
  value: string
}

/**
 * Extends {@link CookieListItem} with the `httpOnly`, `maxAge` and `priority` properties.
 */
export type Cookie = CookieListItem &
  Pick<CookieSerializeOptions, 'httpOnly' | 'maxAge' | 'priority'>

export type CookieBag = Map<string, Cookie>

export type CookieHeader = 'set-cookie' | 'cookie'

/**
 * Loose implementation of the experimental [Cookie Store API](https://wicg.github.io/cookie-store/#dictdef-cookie)
 * The main difference is `CookieStore` methods do not return a Promise.
 */
export class CookieStore {
  readonly #headers: Headers
  readonly #cookieHeader: CookieHeader

  constructor(
    responseOrRequest: Response | Request,
    cookieHeader: CookieHeader = 'set-cookie'
  ) {
    this.#headers = responseOrRequest.headers
    this.#cookieHeader = cookieHeader
  }

  #cache = cached(() => {
    // @ts-expect-error See https://github.com/whatwg/fetch/issues/973
    const headers = this.#headers.getAll(this.#cookieHeader)
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
    const allCookies = this.#headers.get(this.#cookieHeader)
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
    replace(map, this.#headers, this.#cookieHeader)

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
   * Uses {@link CookieStore.delete} to invalidate all cookies matching the given name.
   * If no name is provided, all cookies are invalidated.
   */
  clear(...args: [key: string] | [options: Cookie] | []): this {
    const key = typeof args[0] === 'string' ? args[0] : args[0]?.name
    this.getAll(key).forEach((c) => this.delete(c))
    return this
  }

  [Symbol.for('edge-runtime.inspect.custom')]() {
    return `CookieStore ${JSON.stringify(Object.fromEntries(this.#parsed()))}`
  }
}

function replace(bag: CookieBag, headers: Headers, cookieHeader: CookieHeader) {
  headers.delete(cookieHeader)
  for (const [, value] of bag) {
    const serialized = serialize(value)
    headers.append(cookieHeader, serialized)
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
