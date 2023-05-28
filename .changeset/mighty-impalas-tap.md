---
'@edge-runtime/vm': patch
---

use `eval` to avoid bundlers from trying to statically analyze createRequire
