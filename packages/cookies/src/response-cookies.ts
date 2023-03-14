import type { ResponseCookie } from './types'
import { parseSetCookieString, serialize } from './serialize'

/**
 * A class for manipulating {@link Response} cookies (`Set-Cookie` header).
 * Loose implementation of the experimental [Cookie Store API](https://wicg.github.io/cookie-store/#dictdef-cookie)
 * The main difference is `ResponseCookies` methods do not return a Promise.
 */
export class ResponseCookies {
  /** @internal */
  readonly _headers: Headers
  /** @internal */
  _parsed: Map<string, ResponseCookie> = new Map()

  constructor(responseHeaders: Headers) {
    this._headers = responseHeaders

    const setCookie =
      // @ts-expect-error See https://github.com/whatwg/fetch/issues/973
      responseHeaders.getAll?.('set-cookie') ??
      responseHeaders.get('set-cookie') ??
      []

    const cookieStrings = Array.isArray(setCookie)
      ? setCookie
      : splitCookiesString(setCookie)

    for (const cookieString of cookieStrings) {
      const parsed = parseSetCookieString(cookieString)
      if (parsed) this._parsed.set(parsed.name, parsed)
    }
  }

  /**
   * {@link https://wicg.github.io/cookie-store/#CookieStore-get CookieStore#get} without the Promise.
   */
  get(
    ...args: [key: string] | [options: ResponseCookie]
  ): ResponseCookie | undefined {
    const key = typeof args[0] === 'string' ? args[0] : args[0].name
    return this._parsed.get(key)
  }
  /**
   * {@link https://wicg.github.io/cookie-store/#CookieStore-getAll CookieStore#getAll} without the Promise.
   */
  getAll(
    ...args: [key: string] | [options: ResponseCookie] | []
  ): ResponseCookie[] {
    const all = Array.from(this._parsed.values())
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
      | [key: string, value: string, cookie?: Partial<ResponseCookie>]
      | [options: ResponseCookie]
  ): this {
    const [name, value, cookie] =
      args.length === 1 ? [args[0].name, args[0].value, args[0]] : args
    const map = this._parsed
    map.set(name, normalizeCookie({ name, value, ...cookie }))
    replace(map, this._headers)

    return this
  }

  /**
   * {@link https://wicg.github.io/cookie-store/#CookieStore-delete CookieStore#delete} without the Promise.
   */
  delete(...args: [key: string] | [options: ResponseCookie]): this {
    const name = typeof args[0] === 'string' ? args[0] : args[0].name
    return this.set({ name, value: '', expires: new Date(0) })
  }

  [Symbol.for('edge-runtime.inspect.custom')]() {
    return `ResponseCookies ${JSON.stringify(Object.fromEntries(this._parsed))}`
  }

  toString() {
    return [...this._parsed.values()].map(serialize).join('; ')
  }
}

function replace(bag: Map<string, ResponseCookie>, headers: Headers) {
  headers.delete('set-cookie')
  for (const [, value] of bag) {
    const serialized = serialize(value)
    headers.append('set-cookie', serialized)
  }
}

function normalizeCookie(cookie: ResponseCookie = { name: '', value: '' }) {
  if (typeof cookie.expires === 'number') {
    cookie.expires = new Date(cookie.expires)
  }

  if (cookie.maxAge) {
    cookie.expires = new Date(Date.now() + cookie.maxAge * 1000)
  }

  if (cookie.path === null || cookie.path === undefined) {
    cookie.path = '/'
  }

  return cookie
}

/**
 * @source https://github.com/nfriedly/set-cookie-parser/blob/master/lib/set-cookie.js
 *
 * Set-Cookie header field-values are sometimes comma joined in one string. This splits them without choking on commas
 * that are within a single set-cookie field-value, such as in the Expires portion.
 * This is uncommon, but explicitly allowed - see https://tools.ietf.org/html/rfc2616#section-4.2
 * Node.js does this for every header *except* set-cookie - see https://github.com/nodejs/node/blob/d5e363b77ebaf1caf67cd7528224b651c86815c1/lib/_http_incoming.js#L128
 * React Native's fetch does this for *every* header, including set-cookie.
 *
 * Based on: https://github.com/google/j2objc/commit/16820fdbc8f76ca0c33472810ce0cb03d20efe25
 * Credits to: https://github.com/tomball for original and https://github.com/chrusart for JavaScript implementation
 */
function splitCookiesString(cookiesString: string) {
  if (!cookiesString) return []
  var cookiesStrings = []
  var pos = 0
  var start
  var ch
  var lastComma
  var nextStart
  var cookiesSeparatorFound

  function skipWhitespace() {
    while (pos < cookiesString.length && /\s/.test(cookiesString.charAt(pos))) {
      pos += 1
    }
    return pos < cookiesString.length
  }

  function notSpecialChar() {
    ch = cookiesString.charAt(pos)

    return ch !== '=' && ch !== ';' && ch !== ','
  }

  while (pos < cookiesString.length) {
    start = pos
    cookiesSeparatorFound = false

    while (skipWhitespace()) {
      ch = cookiesString.charAt(pos)
      if (ch === ',') {
        // ',' is a cookie separator if we have later first '=', not ';' or ','
        lastComma = pos
        pos += 1

        skipWhitespace()
        nextStart = pos

        while (pos < cookiesString.length && notSpecialChar()) {
          pos += 1
        }

        // currently special character
        if (pos < cookiesString.length && cookiesString.charAt(pos) === '=') {
          // we found cookies separator
          cookiesSeparatorFound = true
          // pos is inside the next cookie, so back up and return it.
          pos = nextStart
          cookiesStrings.push(cookiesString.substring(start, lastComma))
          start = pos
        } else {
          // in param ',' or param separator ';',
          // we continue from that comma
          pos = lastComma + 1
        }
      } else {
        pos += 1
      }
    }

    if (!cookiesSeparatorFound || pos >= cookiesString.length) {
      cookiesStrings.push(cookiesString.substring(start, cookiesString.length))
    }
  }

  return cookiesStrings
}
