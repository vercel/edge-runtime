/* global URL, URLPattern, Response */

const ROUTES = [
  [
    '/db/:id',
    ({ query, params }) => `Lookup for ${params.id}?cache=${query.cache}`,
  ],
  ['/greetings/:name', ({ params }) => `Greetings, ${params.name}`],
  ['/ping', () => 'pong'],
]

const ROUTER = ROUTES.map(([pathname, handler]) => [
  new URLPattern({ pathname }),
  handler,
])

function getRoute(url) {
  let route

  for (const [pattern, handler] of ROUTER) {
    const result = pattern.exec(url) || {}

    if ('pathname' in result) {
      route = { params: result.pathname.groups, handler }
      break
    }
  }

  return route
}

/**
 * Examples:
 *  - http://localhost:3000/
 *  - http://localhost:3000/db/id?cache=all
 *  - http://localhost:3000/greetings/kiko
 */
addEventListener('fetch', (event) => {
  const { url } = event.request

  const route = getRoute(url)

  if (!route) {
    return event.respondWith(new Response('no route found', { status: 404 }))
  }

  const { params, handler } = route
  const query = Object.fromEntries(new URL(url).searchParams)
  const result = handler({ url, params, query })

  return event.respondWith(new Response(result))
})
