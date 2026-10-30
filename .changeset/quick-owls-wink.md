---
'@edge-runtime/vm': patch
---

Patch `instanceof` for constructors shared with Node.js through `Symbol.hasInstance` instead of wrapping them in a `Proxy`, removing the overhead on every property read (e.g. `Array.isArray`, `Object.keys`). As a result, `[].constructor === Array` and `Object.toString()` behave as expected inside the VM.
