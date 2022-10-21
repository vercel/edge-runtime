# @edge-runtime/cookies

## 2.0.0-beta.34

### Major Changes

- Make `RequestCookies` and `ResponseCookies` more spec compliant by resembling the [Cookie Store API](https://wicg.github.io/cookie-store). The main difference is that the methods do not return `Promise`. ([#177](https://github.com/vercel/edge-runtime/pull/177))

  Breaking changes:

  - `ResponseCookies#get` has been renamed to `ResponseCookies#getValue`
  - `ResponseCookies#getWithOptions` has been renamed to `ResponseCookies#get`

## 1.1.0-beta.33

### Patch Changes

- upgrading undici ([`3207fa2`](https://github.com/vercel/edge-runtime/commit/3207fa224783fecc70ac63aef4cd49a8404ecbc0))

## 1.1.0-beta.32

### Patch Changes

- Change release method to Changesets ([#110](https://github.com/vercel/edge-runtime/pull/110))
