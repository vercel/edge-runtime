/* global addEventListener, Response */

addEventListener('fetch', event => {
  Promise.reject(new TypeError('captured unhandledrejection error.'))
  return event.respondWith(new Response('OK'))
})
