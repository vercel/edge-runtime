import { Cookies } from './cookies'
import type { CookieSerializeOptions } from 'cookie'
import * as cookie from 'cookie'

type HasHeaders = { headers: Headers }

const deserializeCookie = (input: HasHeaders): string[] => {
  const value = input.headers.get('set-cookie')
  return value !== undefined && value !== null ? value.split(', ') : []
}

const serializeCookie = (input: string[]) => input.join(', ')

type GetWithOptionsOutput = {
  value: string | undefined
  options: { [key: string]: string }
}

const serializeExpiredCookie = (
  key: string,
  options: CookieSerializeOptions = {}
) =>
  cookie.serialize(key, '', {
    expires: new Date(0),
    path: '/',
    ...options,
  })

/**
 * This is an implementation of {@link Cookies} that mutates the headers of
 * the given request or response with `Set-Cookie` headers.
 */
export class HeaderMutatingCookies extends Cookies {
  response: HasHeaders

  constructor(response: HasHeaders) {
    super(response.headers.get('cookie'))
    this.response = response
  }
  get = (...args: Parameters<Cookies['get']>) => {
    return this.getWithOptions(...args).value
  }
  getWithOptions = (
    ...args: Parameters<Cookies['get']>
  ): GetWithOptionsOutput => {
    const raw = super.get(...args)
    if (typeof raw !== 'string') return { value: raw, options: {} }
    const { [args[0]]: value, ...options } = cookie.parse(raw)
    return { value, options }
  }
  set = (...args: Parameters<Cookies['set']>) => {
    const isAlreadyAdded = super.has(args[0])

    super.set(...args)
    const currentCookie = super.get(args[0])

    if (typeof currentCookie !== 'string') {
      throw new Error(
        `Invariant: failed to generate cookie for ${JSON.stringify(args)}`
      )
    }

    if (isAlreadyAdded) {
      const setCookie = serializeCookie(
        deserializeCookie(this.response).filter(
          (value) => !value.startsWith(`${args[0]}=`)
        )
      )

      if (setCookie) {
        this.response.headers.set(
          'set-cookie',
          [currentCookie, setCookie].join(', ')
        )
      } else {
        this.response.headers.set('set-cookie', currentCookie)
      }
    } else {
      this.response.headers.append('set-cookie', currentCookie)
    }

    return this
  }
  delete = (key: string, options: CookieSerializeOptions = {}) => {
    const isDeleted = super.delete(key)

    if (isDeleted) {
      const setCookie = serializeCookie(
        deserializeCookie(this.response).filter(
          (value) => !value.startsWith(`${key}=`)
        )
      )
      const expiredCookie = serializeExpiredCookie(key, options)
      this.response.headers.set(
        'set-cookie',
        [expiredCookie, setCookie].join(', ')
      )
    }

    return isDeleted
  }
  clear = (options: CookieSerializeOptions = {}) => {
    const expiredCookies = Array.from(super.keys())
      .map((key) => serializeExpiredCookie(key, options))
      .join(', ')

    if (expiredCookies) this.response.headers.set('set-cookie', expiredCookies)
    return super.clear()
  }
}
