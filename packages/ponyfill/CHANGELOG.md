# @edge-runtime/ponyfill

## 2.4.2

### Patch Changes

- fix: expose `performance` constructor ([#772](https://github.com/vercel/edge-runtime/pull/772))

## 2.4.1

### Patch Changes

- Don't return `NodeJS.Timer` from `setTimeout` and `setInterval` ([#622](https://github.com/vercel/edge-runtime/pull/622))

## 2.4.0

### Minor Changes

- drop node14 support ([`7cc92cc`](https://github.com/vercel/edge-runtime/commit/7cc92ccd190c2d96483202d9f2e1a523778d1f48))

## 2.3.0

### Minor Changes

- Fix `instanceof` tests, upgrade undici and revamp how we import stuff into the VM ([#309](https://github.com/vercel/edge-runtime/pull/309))

## 2.3.0-beta.0

### Minor Changes

- Fix `instanceof` tests, upgrade undici and revamp how we import stuff into the VM ([#309](https://github.com/vercel/edge-runtime/pull/309))

## 2.2.0

### Minor Changes

- Merge `EdgeRuntime` into `EdgeVM` ([#289](https://github.com/vercel/edge-runtime/pull/289))

## 2.1.2

### Patch Changes

- Use valid SPDX license expression ([#276](https://github.com/vercel/edge-runtime/pull/276))

## 2.1.1

### Patch Changes

- build: update dependencies ([#271](https://github.com/vercel/edge-runtime/pull/271))

## 2.1.0

### Minor Changes

- feat(encoding): add `TextDecoderStream` and `TextEncoderStream` ([#267](https://github.com/vercel/edge-runtime/pull/267))

## 2.0.0

### Major Changes

- BREAKING CHANGE: Drop Node.js 12 ([#191](https://github.com/vercel/edge-runtime/pull/191))

## 1.1.0

### Patch Changes

- Allow to use URLPattern as a type with @edge-runtime/ponyfill ([#113](https://github.com/vercel/edge-runtime/pull/113))

- Change release method to Changesets ([#110](https://github.com/vercel/edge-runtime/pull/110))

- Add DOMException primitive ([#143](https://github.com/vercel/edge-runtime/pull/143))

- update edge dependencies ([#160](https://github.com/vercel/edge-runtime/pull/160))

- upgrading undici ([`3207fa2`](https://github.com/vercel/edge-runtime/commit/3207fa224783fecc70ac63aef4cd49a8404ecbc0))

- Only export the specific values from the global scope as we define in our types ([#124](https://github.com/vercel/edge-runtime/pull/124))

## 1.1.0-beta.36

### Patch Changes

- update edge dependencies ([#160](https://github.com/vercel/edge-runtime/pull/160))

## 1.1.0-beta.35

### Patch Changes

- Add DOMException primitive ([#143](https://github.com/vercel/edge-runtime/pull/143))

## 1.1.0-beta.34

### Patch Changes

- upgrading undici ([`3207fa2`](https://github.com/vercel/edge-runtime/commit/3207fa224783fecc70ac63aef4cd49a8404ecbc0))

## 1.1.0-beta.33

### Patch Changes

- Allow to use URLPattern as a type with @edge-runtime/ponyfill ([#113](https://github.com/vercel/edge-runtime/pull/113))

* Only export the specific values from the global scope as we define in our types ([#124](https://github.com/vercel/edge-runtime/pull/124))

## 1.1.0-beta.32

### Patch Changes

- Change release method to Changesets ([#110](https://github.com/vercel/edge-runtime/pull/110))
