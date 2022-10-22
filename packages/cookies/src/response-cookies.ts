import { CookieStore } from './cookie-store'

export class ResponseCookies extends CookieStore {
  constructor(response: Response) {
    super(response, 'set-cookie')
  }

  /**
   * {@link https://wicg.github.io/cookie-store/#CookieStore-get CookieStore#get} without the Promise.
   */
  get = super.get

  /**
   * {@link https://wicg.github.io/cookie-store/#CookieStore-getAll CookieStore#getAll} without the Promise.
   */
  getAll = super.getAll

  /**
   * {@link https://wicg.github.io/cookie-store/#CookieStore-set CookieStore#set} without the Promise.
   */
  set = super.set

  /**
   * {@link https://wicg.github.io/cookie-store/#CookieStore-delete CookieStore#delete} without the Promise.
   */
  delete = super.delete

  // Non-spec

  /**
   * Uses {@link CookieStore.delete} to invalidate all cookies matching the given name.
   * If no name is provided, all cookies are invalidated.
   */
  clear = super.clear
}
