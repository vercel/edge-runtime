import { fetch, Request, Response } from './fetch'

/**
 * @type {() => { Cache, cacheStorage: () => CacheStorage }}
 */
export function createCaches() {
  const getKey = (request) => new URL(request.url).toString()

  /**
   * Normalize a request input, preventing to be normalized twice
   */
  const normalizeRequest = (input, { invokeName }) => {
    if (typeof proxy === 'object' && proxy.__normalized__) return input

    const request = input instanceof Request ? input : new Request(input)

    if (request.method !== 'GET') {
      throw new TypeError(
        `Failed to execute '${invokeName}' on 'Cache': Request method '${request.method}' is unsupported`
      )
    }

    if (!request.url.startsWith('http')) {
      throw new TypeError(
        `Failed to execute '${invokeName}' on 'Cache': Request scheme '${
          request.url.split(':')[0]
        }' is unsupported`
      )
    }

    Object.defineProperty(request, '__normalized__', {
      enumerable: false,
      writable: false,
      value: true,
    })

    return request
  }

  class Cache {
    constructor(Storage = Map) {
      Object.defineProperty(this, 'store', {
        enumerable: false,
        writable: false,
        value: new Storage(),
      })
    }

    /**
     * The add() method of the Cache interface takes a URL, retrieves it,
     * and adds the resulting response object to the given cache.
     *
     * https://w3c.github.io/ServiceWorker/#cache-add
     */
    async add(request) {
      const response = await fetch(
        normalizeRequest(request, { invokeName: 'add' })
      )

      if (!response.ok) {
        throw new TypeError(
          "Failed to execute 'add' on 'Cache': Request failed"
        )
      }

      return this.put(request, response)
    }

    /**
     * The addAll() method of the Cache interface takes an array of
     * URLs, retrieves them, and adds the resulting response objects
     * to the given cache. The request objects created during
     * retrieval become keys to the stored response operations.
     *
     * https://w3c.github.io/ServiceWorker/#cache-addAll
     */
    async addAll(requests) {
      await Promise.all(requests.map((request) => this.add(request)))
    }

    /**
     * The match() method of the Cache interface returns a Promise that
     * resolves to the Response associated with the first matching
     * request in the Cache object. If no match is found, the Promise resolves to undefined.
     *
     * https://w3c.github.io/ServiceWorker/#cache-storage-match
     */
    async match(request) {
      const key = getKey(normalizeRequest(request, { invokeName: 'match' }))
      const cached = this.store.get(key)
      return cached ? new Response(cached.body, cached.init) : undefined
    }

    /**
     * The delete() method of the Cache interface finds the Cache entry whose
     * key is the request, and if found, deletes the Cache entry and returns
     * a Promise that resolves to true. If no Cache entry is found, it resolves to false.
     *
     * https://w3c.github.io/ServiceWorker/#cache-delete
     */
    async delete(request) {
      const key = getKey(normalizeRequest(request, { invokeName: 'delete' }))
      return this.store.delete(key)
    }

    /**
     * The put() method of the Cache interface allows
     * key/value pairs to be added to the current Cache object.
     * Often, you will just want to fetch() one or more requests,
     * then add the result straight to your cache.
     *
     * In such cases you are better off using
     * Cache.add()/Cache.addAll(), as they are shorthand functions
     * for one or more of these operations.
     *
     * https://w3c.github.io/ServiceWorker/#cache-put
     */
    async put(request, response) {
      if (response.status === 206) {
        throw new TypeError(
          "Failed to execute 'put' on 'Cache': Partial response (status code 206) is unsupported"
        )
      }

      const vary = response.headers.get('vary')

      if (vary !== null && vary.includes('*')) {
        throw new TypeError(
          "Failed to execute 'put' on 'Cache': Vary header contains *"
        )
      }

      request = normalizeRequest(request, { invokeName: 'put' })

      try {
        this.store.set(getKey(request), {
          body: new Uint8Array(await response.arrayBuffer()),
          init: {
            status: response.status,
            headers: [...response.headers],
          },
        })
      } catch (error) {
        if (error.message === 'disturbed') {
          throw new TypeError('The body has already been consumed.')
        }
        throw error
      }
    }
  }

  const cacheStorage = (Storage = Map) => {
    const caches = new Storage()

    /**
     * The open() method of the CacheStorage interface returns a Promise
     * that resolves to the Cache object matching the cacheName.
     *
     * https://w3c.github.io/ServiceWorker/#cache-storage-open
     */
    const open = async (cacheName) => {
      let cache = caches.get(cacheName)

      if (cache === undefined) {
        cache = new Cache(Storage)
        caches.set(cacheName, cache)
      }

      return cache
    }

    /**
     * The has() method of the CacheStorage interface returns a
     * Promise that resolves to true if a Cache object matches
     * the cacheName.
     *
     * https://w3c.github.io/ServiceWorker/#cache-storage-has
     */
    const has = (cacheName) => Promise.resolve(caches.has(cacheName))

    /**
     * The keys() method of the CacheStorage interface returns a
     * Promise that will resolve with an array containing strings
     * corresponding to all of the named Cache objects tracked
     * by the CacheStorage object in the order they were created.
     * Use this method to iterate over a list of all Cache objects.
     *
     * https://w3c.github.io/ServiceWorker/#cache-storage-keys
     */
    const keys = () => Promise.resolve(caches.keys())

    /**
     * The delete() method of the CacheStorage interface finds
     * the Cache object matching the cacheName,
     * and if found, deletes the Cache object and returns a
     * Promise that resolves to true.
     * If no Cache object is found, it resolves to false.
     *
     * https://w3c.github.io/ServiceWorker/#cache-storage-delete
     */
    const _delete = (cacheName) => Promise.resolve(caches.delete(cacheName))

    const match = async (request, options) => {
      for (const cache of caches.values()) {
        const cached = await cache.match(request, options)
        if (cached !== undefined) return cached
      }
    }

    return {
      open,
      has,
      keys,
      delete: _delete,
      match,
    }
  }

  return { Cache, cacheStorage }
}

export function Cache() {
  if (!(this instanceof Cache)) return new Cache()
  throw TypeError('Illegal constructor')
}

export function CacheStorage() {
  if (!(this instanceof CacheStorage)) return new CacheStorage()
  throw TypeError('Illegal constructor')
}

export const caches = (() => {
  const { cacheStorage } = createCaches()
  const caches = cacheStorage()
  caches.open('default')
  return caches
})()
