export function createCaches(): {
  cacheStorage: () => CacheStorage;
  Cache: typeof Cache;
  CacheStorage: typeof CacheStorage;
}

export const caches: CacheStorage;
export { CacheStorage };
export { Cache };
