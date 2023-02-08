import type { Headers } from '@edge-runtime/primitives'
import type { OutgoingHttpHeaders, ServerResponse } from 'node:http'

export function toOutgoingHeaders(
  headers?: Headers & { raw?: () => Record<string, string> }
): OutgoingHttpHeaders {
  const outputHeaders: OutgoingHttpHeaders = {}
  if (headers) {
    for (const [name, value] of typeof headers.raw !== 'undefined'
      ? Object.entries(headers.raw())
      : headers.entries()) {
      outputHeaders[name] = value
      if (name.toLowerCase() === 'set-cookie') {
        outputHeaders[name] =
          headers.getAll?.('set-cookie') ?? splitCookiesString(value)
      }
    }
  }
  return outputHeaders
}

export function mergeIntoServerResponse(
  headers: OutgoingHttpHeaders,
  serverResponse: ServerResponse
) {
  for (const [name, value] of Object.entries(headers)) {
    if (value !== undefined) {
      serverResponse.setHeader(name, value)
    }
  }
}

/*
  Set-Cookie header field-values are sometimes comma joined in one string. This splits them without choking on commas
  that are within a single set-cookie field-value, such as in the Expires portion.
  This is uncommon, but explicitly allowed - see https://tools.ietf.org/html/rfc2616#section-4.2
  Node.js does this for every header *except* set-cookie - see https://github.com/nodejs/node/blob/d5e363b77ebaf1caf67cd7528224b651c86815c1/lib/_http_incoming.js#L128
  React Native's fetch does this for *every* header, including set-cookie.
  
  Based on: https://github.com/google/j2objc/commit/16820fdbc8f76ca0c33472810ce0cb03d20efe25
  Credits to: https://github.com/tomball for original and https://github.com/chrusart for JavaScript implementation
*/
function splitCookiesString(cookiesString: string) {
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
