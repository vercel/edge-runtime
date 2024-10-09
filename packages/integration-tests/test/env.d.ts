declare module 'multer' {
  declare const multer: {
    (args: any): any
    memoryStorage: (args?: any) => any
  }
  export = multer
}

interface Headers {
  /**
   * This method is polyfilled in Edge Runtime,
   * and therefore might exist and might not exist in runtime.
   *
   * @deprecated use {@link Headers.getSetCookie}
   */
  getAll?(name: 'set-cookie' | (string & {})): string[]
}

class WeakRef<T> {
  deref(): T | undefined
  constructor(value: T)
}
