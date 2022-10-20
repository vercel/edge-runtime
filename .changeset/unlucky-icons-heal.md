---
'@edge-runtime/cookies': major
---

Make `RequestCookies` and `ResponseCookies` more spec compliant by resembling the [Cookie Store API](https://wicg.github.io/cookie-store). The main difference is that the methods do not return `Promise`.

Breaking changes:

- `ResponseCookies#get` has been renamed to `ResponseCookies#getValue`
- `ResponseCookies#getWithOptions` has been renamed to `ResponseCookies#get`
