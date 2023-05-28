# @edge-runtime/primitives

## 2.2.0-beta.11

### Patch Changes

- Don't remove Blob from global scope, and use global Blob if available ([#359](https://github.com/vercel/edge-runtime/pull/359))

## 2.2.0-beta.10

### Patch Changes

- bump undici to v5.22.1 ([#357](https://github.com/vercel/edge-runtime/pull/357))

## 2.2.0-beta.9

### Patch Changes

- Remove dynamic path manipulation ([#353](https://github.com/vercel/edge-runtime/pull/353))

## 2.2.0-beta.8

### Patch Changes

- remove dynamism in imports: add a `${primitive}.text.js` file that will be ([#351](https://github.com/vercel/edge-runtime/pull/351))
  required, instead of using `fs` to read the file at runtime.

  This will help bundlers to statically analyze the code.

## 2.2.0-beta.7

### Patch Changes

- fix entries iteration on Headers ([#346](https://github.com/vercel/edge-runtime/pull/346))

## 2.2.0-beta.6

### Patch Changes

- Use path.join instead of path.resolve, if possible ([#344](https://github.com/vercel/edge-runtime/pull/344))

## 2.2.0-beta.5

### Patch Changes

- Fix `@/primitives/load` types by externalizing `@/primitives/index` in the type definition ([#338](https://github.com/vercel/edge-runtime/pull/338))

## 2.2.0-beta.4

### Patch Changes

- expose `primitives/load` ([#336](https://github.com/vercel/edge-runtime/pull/336))

## 2.2.0-beta.3

### Minor Changes

- use node's webcrypto when available ([#326](https://github.com/vercel/edge-runtime/pull/326))

### Patch Changes

- Extract a `@edge-runtime/primitives/load` entrypoint that loads the primitives given a scoped global context ([#327](https://github.com/vercel/edge-runtime/pull/327))

## 2.2.0-beta.2

### Patch Changes

- Don't use require.resolve for the custom import resolution ([#324](https://github.com/vercel/edge-runtime/pull/324))

## 2.2.0-beta.1

### Patch Changes

- bugfix: Request can now be extended ([#322](https://github.com/vercel/edge-runtime/pull/322))

## 2.2.0-beta.0

### Minor Changes

- Fix `instanceof` tests, upgrade undici and revamp how we import stuff into the VM ([#309](https://github.com/vercel/edge-runtime/pull/309))

## 2.1.2

### Patch Changes

- Use valid SPDX license expression ([#276](https://github.com/vercel/edge-runtime/pull/276))

## 2.1.1

### Patch Changes

- build: update dependencies ([#271](https://github.com/vercel/edge-runtime/pull/271))

## 2.1.0

### Minor Changes

- feat(encoding): add `TextDecoderStream` and `TextEncoderStream` ([#267](https://github.com/vercel/edge-runtime/pull/267))

## 2.0.5

### Patch Changes

- We are already falling back in code, the types just need to reflect this correctly ([#262](https://github.com/vercel/edge-runtime/pull/262))

## 2.0.4

### Patch Changes

- build: update dependencies ([`029c6af`](https://github.com/vercel/edge-runtime/commit/029c6afe2b1a56a1c105663de6b0d6715a7b4f0a))

## 2.0.3

### Patch Changes

- Introducing @edge-runtime/node-utils to run edge-compliant code in Node.js environment ([#219](https://github.com/vercel/edge-runtime/pull/219))

## 2.0.2

### Patch Changes

- fix: addEvenlistener type ([#201](https://github.com/vercel/edge-runtime/pull/201))

## 2.0.1

### Patch Changes

- build(primitives): update peculiar/webcrypto ([#197](https://github.com/vercel/edge-runtime/pull/197))

## 2.0.0

### Major Changes

- BREAKING CHANGE: Drop Node.js 12 ([#191](https://github.com/vercel/edge-runtime/pull/191))

## 1.1.0

### Patch Changes

- Allow to use URLPattern as a type with @edge-runtime/ponyfill ([#113](https://github.com/vercel/edge-runtime/pull/113))

- build(deps-dev): bump urlpattern-polyfill from 5.0.9 to 6.0.1 ([#154](https://github.com/vercel/edge-runtime/pull/154))

- Change release method to Changesets ([#110](https://github.com/vercel/edge-runtime/pull/110))

- fix(primitives): expose console.debug method ([#174](https://github.com/vercel/edge-runtime/pull/174))

- upgrading undici ([`3207fa2`](https://github.com/vercel/edge-runtime/commit/3207fa224783fecc70ac63aef4cd49a8404ecbc0))

- build(deps-dev): bump undici from 5.10.0 to 5.11.0 ([#156](https://github.com/vercel/edge-runtime/pull/156))

- Mark the createCaches export as nullable as it does not exist in Edge Runtime ([#124](https://github.com/vercel/edge-runtime/pull/124))

## 1.1.0-beta.37

### Patch Changes

- fix(primitives): expose console.debug method ([#174](https://github.com/vercel/edge-runtime/pull/174))

## 1.1.0-beta.36

### Patch Changes

- build(deps-dev): bump undici from 5.10.0 to 5.11.0 ([#156](https://github.com/vercel/edge-runtime/pull/156))

## 1.1.0-beta.35

### Patch Changes

- build(deps-dev): bump urlpattern-polyfill from 5.0.9 to 6.0.1 ([#154](https://github.com/vercel/edge-runtime/pull/154))

## 1.1.0-beta.34

### Patch Changes

- upgrading undici ([`3207fa2`](https://github.com/vercel/edge-runtime/commit/3207fa224783fecc70ac63aef4cd49a8404ecbc0))

## 1.1.0-beta.33

### Patch Changes

- Allow to use URLPattern as a type with @edge-runtime/ponyfill ([#113](https://github.com/vercel/edge-runtime/pull/113))

* Mark the createCaches export as nullable as it does not exist in Edge Runtime ([#124](https://github.com/vercel/edge-runtime/pull/124))

## 1.1.0-beta.32

### Patch Changes

- Change release method to Changesets ([#110](https://github.com/vercel/edge-runtime/pull/110))
