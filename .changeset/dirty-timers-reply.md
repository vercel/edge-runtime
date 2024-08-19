---
'@edge-runtime/primitives': minor
---

remove custom entries() iterator in favor of Undici's default implementation

The difference will be that `set-cookie` headers will be emitted independently.

```ts
const headers = new Headers()
headers.append('set-cookie', 'a=1')
headers.append('set-cookie', 'b=2')

const entries = [...headers.entries()]

// previous implementation
console.log(entries) // [["set-cookie", "a=1, b=2"]]

// new implementation (undici's native implementation)
console.log(entries) // [["set-cookie", "a=1"], ["set-cookie", "b=2"]]
```
