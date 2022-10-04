import { fetch, Request, Response } from '../fetch'
import {
  caches,
  createCaches,
  Cache as ICache,
  CacheStorage as ICacheStorage,
} from '../cache'

const { cacheStorage, Cache } = createCaches()

test('Cache is an interface', () => {
  expect.assertions(2)

  try {
    new ICache()
  } catch (error: any) {
    expect(error.name).toBe('TypeError')
    expect(error.message).toBe('Illegal constructor')
  }
})

test('CacheStorage is an interface', () => {
  expect.assertions(2)

  try {
    new ICacheStorage()
  } catch (error: any) {
    expect(error.name).toBe('TypeError')
    expect(error.message).toBe('Illegal constructor')
  }
})

test('the default caches object has a default namespace', async () => {
  expect(Array.from(await caches.keys())).toEqual(['default'])
})

test('caches.open', async () => {
  const caches = cacheStorage()
  const cache = await caches.open('my_cache')

  expect(cache instanceof Cache).toBe(true)
  expect(Array.from(await caches.keys())).toEqual(['my_cache'])
})

test('caches.has', async () => {
  const caches = cacheStorage()

  expect(await caches.has('my_cache')).toBe(false)
  await caches.open('my_cache')
  expect(await caches.has('my_cache')).toBe(true)
})

test('caches.keys', async () => {
  const caches = cacheStorage()

  await caches.open('my_cache_1')
  expect(Array.from(await caches.keys())).toEqual(['my_cache_1'])

  await caches.open('my_cache_2')
  expect(Array.from(await caches.keys())).toEqual(['my_cache_1', 'my_cache_2'])

  await caches.open('my_cache_3')
  expect(Array.from(await caches.keys())).toEqual([
    'my_cache_1',
    'my_cache_2',
    'my_cache_3',
  ])
})

test('caches.delete', async () => {
  const caches = cacheStorage()

  expect(await caches.delete('my_cache_1')).toBe(false)
  expect(Array.from(await caches.keys())).toEqual([])

  await caches.open('my_cache_1')

  expect(Array.from(await caches.keys())).toEqual(['my_cache_1'])
  expect(await caches.delete('my_cache_1')).toBe(true)
  expect(Array.from(await caches.keys())).toEqual([])
})

test('caches.match', async () => {
  const caches = cacheStorage()

  await caches.open('my_cache_1')
  const cache = await caches.open('my_cache_2')
  await caches.open('my_cache_3')

  const request = new Request('https://example.vercel.sh')
  await cache.add(request)

  expect(await cache.match(request)).toBeTruthy()
  expect(await caches.match(request)).toBeTruthy()
})

test('cache.put', async () => {
  const cache = new Cache()
  const request = new Request('https://example.vercel.sh')
  const response = await fetch(request)
  const result = await cache.put(request, response)

  expect(result).toBeUndefined()
})

test('cache.put throws an error under non GET method', async () => {
  expect.assertions(2)

  try {
    const cache = new Cache()
    const request = new Request('https://example.vercel.sh', {
      method: 'POST',
    })
    await cache.put(request, new Response())
  } catch (error: any) {
    expect(error instanceof Error).toBe(true)
    expect(error.message).toBe(
      "Failed to execute 'put' on 'Cache': Request method 'POST' is unsupported"
    )
  }
})

test('cache.put throws an error under non http(s) protocol', async () => {
  expect.assertions(2)

  try {
    const cache = new Cache()
    const request = new Request('ipfs://example.vercel.app')
    await cache.put(request, new Response())
  } catch (error: any) {
    expect(error instanceof Error).toBe(true)
    expect(error.message).toBe(
      "Failed to execute 'put' on 'Cache': Request scheme 'ipfs' is unsupported"
    )
  }
})

test('cache.put throws an error if response status is 206', async () => {
  expect.assertions(2)

  try {
    const cache = new Cache()
    const request = new Request('https://example.vercel.sh')
    const response = new Response(null, { status: 206 })
    await cache.put(request, response)
  } catch (error: any) {
    expect(error instanceof Error).toBe(true)
    expect(error.message).toBe(
      "Failed to execute 'put' on 'Cache': Partial response (status code 206) is unsupported"
    )
  }
})

test('cache.put throws an error if response vary header is *', async () => {
  expect.assertions(2)

  try {
    const cache = new Cache()
    const request = new Request('https://example.vercel.sh')
    const response = new Response(null, { headers: { 'vary': '*' } })
    await cache.put(request, response)
  } catch (error: any) {
    expect(error instanceof Error).toBe(true)
    expect(error.message).toBe(
      "Failed to execute 'put' on 'Cache': Vary header contains *"
    )
  }
})

test('cache.put throws an error if response body is used or locked', async () => {
  expect.assertions(2)

  try {
    const cache = new Cache()
    const request = new Request('https://example.vercel.sh')
    const response = new Response('')
    response.text()
    await cache.put(request, response)
  } catch (error: any) {
    expect(error instanceof Error).toBe(true)
    expect(error.message).toBe('The body has already been consumed.')
  }
})

test('cache.add', async () => {
  const cache = new Cache()
  const request = new Request('https://example.vercel.sh')
  const result = await cache.add(request)

  expect(result).toBeUndefined()
})

test('cache.add throws an error if response is not ok', async () => {
  expect.assertions(2)

  try {
    const cache = new Cache()
    const request = new Request('https://test-403.vercel.app')
    await cache.add(request)
  } catch (error: any) {
    expect(error instanceof Error).toBe(true)
    expect(error.message).toBe(
      "Failed to execute 'add' on 'Cache': Request failed"
    )
  }
})

test('cache.addAll', async () => {
  const cache = new Cache()

  const result = await cache.addAll([
    'https://example.vercel.sh',
    'https://edge-ping.vercel.app',
  ])

  expect(result).toBeUndefined()
})

test('cache.match', async () => {
  const cache = new Cache()
  const request = new Request('https://example.vercel.sh')
  await cache.add(request)

  const response = await cache.match(request)

  expect(response?.status).toBe(200)
})

test('cache.delete', async () => {
  const cache = new Cache()
  const request = new Request('https://example.vercel.sh')

  expect(await cache.delete(request)).toBe(false)

  await cache.add(request)

  expect(await cache.match(request)).toBeTruthy()

  expect(await cache.delete(request)).toBe(true)

  expect(await cache.match(request)).toBeFalsy()
})

test.todo('cache.match(request, options)')

test.todo('cache.matchAll(request, options)')

test.todo('cache.keys')

test.todo('cache.keys(request, options)')
