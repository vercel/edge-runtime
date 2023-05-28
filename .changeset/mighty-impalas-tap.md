---
'@edge-runtime/vm': major
---

remove `.require` helpers. This is not necessary as people can add dependencies
to the context and instanceof should just work.

we don't use the vm as a security boundary, so we don't need to worry about
people adding malicious code to the context.
