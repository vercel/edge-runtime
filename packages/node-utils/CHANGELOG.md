# @edge-runtime/node-utils

## 2.0.0

### Major Changes

- Provides mocked fetch event which throws when using `waitUntil`. `buildToNodeHandler()`'s dependencies now requires `FetchEvent` constructor. ([#244](https://github.com/vercel/edge-runtime/pull/244))

- Uses host header as request origin when available. `buildToNodeHandler()`'s `origin` option has been renamed into `defaultOrigin`. ([#244](https://github.com/vercel/edge-runtime/pull/244))

## 1.0.0

### Patch Changes

- Introducing @edge-runtime/node-utils to run edge-compliant code in Node.js environment ([#219](https://github.com/vercel/edge-runtime/pull/219))
