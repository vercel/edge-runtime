import type { RequestCookie, ResponseCookie } from './types'

export function stringifyCookie(c: ResponseCookie | RequestCookie): string {
  const attrs = [
    'path' in c && c.path && `Path=${c.path}`,
    'expires' in c &&
      (c.expires || c.expires === 0) &&
      `Expires=${(typeof c.expires === 'number'
        ? new Date(c.expires)
        : c.expires
      ).toUTCString()}`,
    'maxAge' in c && typeof c.maxAge === 'number' && `Max-Age=${c.maxAge}`,
    'domain' in c && c.domain && `Domain=${c.domain}`,
    'secure' in c && c.secure && 'Secure',
    'httpOnly' in c && c.httpOnly && 'HttpOnly',
    'sameSite' in c && c.sameSite && `SameSite=${c.sameSite}`,
  ].filter(Boolean)

  return `${c.name}=${encodeURIComponent(c.value ?? '')}; ${attrs.join('; ')}`
}

/** Parse a `Cookie` header value */
export function parseCookie(cookie: string) {
  const map = new Map<string, string>()

  for (const pair of cookie.split(/; */)) {
    if (!pair) continue

    const splitAt = pair.indexOf('=')

    // If the attribute doesn't have a value, set it to 'true'.
    if (splitAt === -1) {
      map.set(pair, 'true')
      continue
    }

    // Otherwise split it into key and value and trim the whitespace on the
    // value.
    const [key, value] = [pair.slice(0, splitAt), pair.slice(splitAt + 1)]
    try {
      map.set(key, decodeURIComponent(value ?? 'true'))
    } catch {
      // ignore invalid encoded values
    }
  }

  return map
}

/** Parse a `Set-Cookie` header value */
export function parseSetCookie(setCookie: string): undefined | ResponseCookie {
  if (!setCookie) {
    return undefined
  }

  const [[name, value], ...attributes] = parseCookie(setCookie)
  const { domain, expires, httponly, maxage, path, samesite, secure } =
    Object.fromEntries(
      attributes.map(([key, value]) => [key.toLowerCase(), value]),
    )
  const cookie: ResponseCookie = {
    name,
    value: decodeURIComponent(value),
    domain,
    ...(expires && { expires: new Date(expires) }),
    ...(httponly && { httpOnly: true }),
    ...(typeof maxage === 'string' && { maxAge: Number(maxage) }),
    path,
    ...(samesite && { sameSite: parseSameSite(samesite) }),
    ...(secure && { secure: true }),
  }

  return compact(cookie)
}

function compact<T>(t: T): T {
  const newT = {} as Partial<T>
  for (const key in t) {
    if (t[key]) {
      newT[key] = t[key]
    }
  }
  return newT as T
}

const SAME_SITE: ResponseCookie['sameSite'][] = ['strict', 'lax', 'none']

function parseSameSite(string: string): ResponseCookie['sameSite'] {
  string = string.toLowerCase()
  return SAME_SITE.includes(string as any)
    ? (string as ResponseCookie['sameSite'])
    : undefined
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
export function splitCookiesString(cookiesString: string) {
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
