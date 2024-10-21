# @edge-runtime/cookies

## 5.0.1

### Patch Changes

- fix(cookies): set options when deleting cookies ([#890](https://github.com/vercel/edge-runtime/pull/890))

## 5.0.0

### Major Changes

- use MIT license ([#909](https://github.com/vercel/edge-runtime/pull/909))

## 4.1.1

### Patch Changes

- Fix cookie header format ([#844](https://github.com/vercel/edge-runtime/pull/844))

## 4.1.0

### Minor Changes

- Add cookies partitioned attribute ([#825](https://github.com/vercel/edge-runtime/pull/825))

## 4.0.3

### Patch Changes

- build: upgrade tsup ([#773](https://github.com/vercel/edge-runtime/pull/773))

- fix: expose `performance` constructor ([#772](https://github.com/vercel/edge-runtime/pull/772))

## 4.0.2

### Patch Changes

- Add fallback implementation for `Headers#getSetCookie` ([#650](https://github.com/vercel/edge-runtime/pull/650))

## 4.0.1

### Patch Changes

- fix cookies() .set() to reflect the priority attribute into set-cookie ([#640](https://github.com/vercel/edge-runtime/pull/640))

## 4.0.0

### Major Changes

- Simplify `set-cookie` handling ([#586](https://github.com/vercel/edge-runtime/pull/586))

## 3.4.1

### Patch Changes

- use `Headers#getSetCookie` when available ([#540](https://github.com/vercel/edge-runtime/pull/540))

## 3.4.0

### Minor Changes

- drop node14 support ([`7cc92cc`](https://github.com/vercel/edge-runtime/commit/7cc92ccd190c2d96483202d9f2e1a523778d1f48))

### Patch Changes

- Fixes documentation for ResponseCookies ([#547](https://github.com/vercel/edge-runtime/pull/547))

## 3.3.0

### Minor Changes

- expose serialization functions ([`dc587c2`](https://github.com/vercel/edge-runtime/commit/dc587c27e71cc9f717c9c58de85663156eab914b))

### Patch Changes

- add `.has` in `ResponseCookies` ([#533](https://github.com/vercel/edge-runtime/pull/533))

## 3.2.3

### Patch Changes

- Honor domain and path when deleting cookies ([#507](https://github.com/vercel/edge-runtime/pull/507))

## 3.2.2

### Patch Changes

- chore(cookies): expose `.splitCookiesString` ([#473](https://github.com/vercel/edge-runtime/pull/473))

## 3.2.1

### Patch Changes

- Fixed Cookie Parsing ([#374](https://github.com/vercel/edge-runtime/pull/374))

## 3.2.0

### Minor Changes

- Fix `instanceof` tests, upgrade undici and revamp how we import stuff into the VM ([#309](https://github.com/vercel/edge-runtime/pull/309))

### Patch Changes

- fix: Max-Age=0 being dropped from set-cookie header ([#348](https://github.com/vercel/edge-runtime/pull/348))

## 3.2.0-beta.1

### Patch Changes

- fix: Max-Age=0 being dropped from set-cookie header ([#348](https://github.com/vercel/edge-runtime/pull/348))

## 3.2.0-beta.0

### Minor Changes

- Fix `instanceof` tests, upgrade undici and revamp how we import stuff into the VM ([#309](https://github.com/vercel/edge-runtime/pull/309))

## 3.1.0

### Minor Changes

- Merge `EdgeRuntime` into `EdgeVM` ([#289](https://github.com/vercel/edge-runtime/pull/289))

## 3.0.6

### Patch Changes

- Accept `DOMHighResTimeStamp` on expires of cookie ([#284](https://github.com/vercel/edge-runtime/pull/284))

## 3.0.5

### Patch Changes

- Use valid SPDX license expression ([#276](https://github.com/vercel/edge-runtime/pull/276))

## 3.0.4

### Patch Changes

- Only split on first occurrence of "=" ([#259](https://github.com/vercel/edge-runtime/pull/259))

## 3.0.3

### Patch Changes

- Be able to split `set-cookie` without `getAll` ([#255](https://github.com/vercel/edge-runtime/pull/255))

  Ref: https://github.com/whatwg/fetch/issues/973

## 3.0.2

### Patch Changes

- Fix [URIError]: URI malformed using middleware ([#215](https://github.com/vercel/edge-runtime/pull/215))

## 3.0.1

### Patch Changes

- Add `.toString()`, use `_` + `@internal` JSDoc comment instead of `#` private properties elsewhere ([#210](https://github.com/vercel/edge-runtime/pull/210))

## 3.0.0

### Major Changes

- BREAKING CHANGE: Drop Node.js 12 ([#191](https://github.com/vercel/edge-runtime/pull/191))

## 2.0.2

### Patch Changes

- remove #cached in favor of doing computation in the constructor ([#188](https://github.com/vercel/edge-runtime/pull/188))

## 2.0.1

### Patch Changes

- Align `RequestCookies` API with `ResponseCookies` ([#187](https://github.com/vercel/edge-runtime/pull/187))

## 2.0.0

### Major Changes

- Align `RequestCookies` and `ResponseCookies` APIs as much as possible with [CookieStore](https://developer.mozilla.org/en-US/docs/Web/API/CookieStore) ([#181](https://github.com/vercel/edge-runtime/pull/181))

- Make `RequestCookies` and `ResponseCookies` more spec compliant by resembling the [Cookie Store API](https://wicg.github.io/cookie-store). The main difference is that the methods do not return `Promise`. ([#177](https://github.com/vercel/edge-runtime/pull/177))

  Breaking changes:

  - `ResponseCookies#get` has been renamed to `ResponseCookies#getValue`
  - `ResponseCookies#getWithOptions` has been renamed to `ResponseCookies#get`

### Patch Changes

- Change release method to Changesets ([#110](https://github.com/vercel/edge-runtime/pull/110))

- upgrading undici ([`3207fa2`](https://github.com/vercel/edge-runtime/commit/3207fa224783fecc70ac63aef4cd49a8404ecbc0))

## 2.0.0-beta.35

### Major Changes

- Align `RequestCookies` and `ResponseCookies` APIs as much as possible with [CookieStore](https://developer.mozilla.org/en-US/docs/Web/API/CookieStore) ([#181](https://github.com/vercel/edge-runtime/pull/181))

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
