---
'@edge-runtime/primitives': patch
---

Reverts the removal of `Headers#getAll` introduced in #586 for compatibility reasons. It is still marked as deprecated, as `Headers.getSetCookie` is the prefferred method now.
