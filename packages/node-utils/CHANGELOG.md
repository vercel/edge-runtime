# @edge-runtime/node-utils

## 2.0.3

### Patch Changes

- Use valid SPDX license expression ([#276](https://github.com/vercel/edge-runtime/pull/276))

## 2.0.2

### Patch Changes

- We are already falling back in code, the types just need to reflect this correctly ([#262](https://github.com/vercel/edge-runtime/pull/262))

## 2.0.1

### Patch Changes

- build: update dependencies ([`029c6af`](https://github.com/vercel/edge-runtime/commit/029c6afe2b1a56a1c105663de6b0d6715a7b4f0a))

## 2.0.0

### Major Changes

- Provides mocked fetch event which throws when using `waitUntil`. `buildToNodeHandler()`'s dependencies now requires `FetchEvent` constructor. ([#244](https://github.com/vercel/edge-runtime/pull/244))

- Uses host header as request origin when available. `buildToNodeHandler()`'s `origin` option has been renamed into `defaultOrigin`. ([#244](https://github.com/vercel/edge-runtime/pull/244))

## 1.0.0

### Patch Changes

- Introducing @edge-runtime/node-utils to run edge-compliant code in Node.js environment ([#219](https://github.com/vercel/edge-runtime/pull/219))
