/* global addEventListener, Response */

async function handleRequest(event) {
  const cache = await caches.open('default')
  const { searchParams } = new URL(event.request.url)
  const url = searchParams.get('url') || 'https://example.com'

  const cacheKey = new URL(url).toString()
  const request = new Request(cacheKey)

  let response = await cache.match(request)
  const isHIT = !!response

  if (isHIT) {
    response.headers.set('x-cache-status', 'HIT')
    return response
  }

  response = await fetch(cacheKey)
  response.headers.set('x-cache-status', 'MISS')

  event.waitUntil(cache.put(cacheKey, response.clone()))
  return response
}

addEventListener('fetch', (event) => {
  try {
    return event.respondWith(handleRequest(event))
  } catch (e) {
    return event.respondWith(new Response('Error thrown ' + e.message))
  }
})
