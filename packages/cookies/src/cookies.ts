import type { CookieSerializeOptions } from 'cookie'
import * as cookie from 'cookie'

const normalizeCookieOptions = (options: CookieSerializeOptions) => {
  options = Object.assign({}, options)

  if (options.maxAge) {
    options.expires = new Date(Date.now() + options.maxAge * 1000)
  }

  if (options.path == null) {
    options.path = '/'
  }

  return options
}

const serializeValue = (value: unknown) =>
  typeof value === 'object' ? `j:${JSON.stringify(value)}` : String(value)

export class Cookies extends Map<string, string> {
  constructor(input?: string | null) {
    const parsedInput = typeof input === 'string' ? cookie.parse(input) : {}
    super(Object.entries(parsedInput))
  }

  set(key: string, value: unknown, options: CookieSerializeOptions = {}) {
    return super.set(
      key,
      cookie.serialize(
        key,
        serializeValue(value),
        normalizeCookieOptions(options)
      )
    )
  }

  [Symbol.for('edge-runtime.inspect.custom')]() {
    return Object.fromEntries(this.entries())
  }
}
