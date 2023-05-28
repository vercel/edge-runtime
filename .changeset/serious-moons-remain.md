---
'@edge-runtime/primitives': patch
---

remove dynamism in imports: add a `${primitive}.text.js` file that will be
required, instead of using `fs` to read the file at runtime.

This will help bundlers to statically analyze the code.
