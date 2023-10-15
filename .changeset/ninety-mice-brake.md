---
'@edge-runtime/jest-environment': major
'@edge-runtime/jest-expect': major
'@edge-runtime/node-utils': major
'@edge-runtime/primitives': major
'@edge-runtime/user-agent': major
'@edge-runtime/ponyfill': major
'@edge-runtime/cookies': major
'edge-runtime': major
'@edge-runtime/format': major
'@edge-runtime/types': major
'@edge-runtime/vm': major
---

Drop Node.js 16 support as it has reached EOL.

This let's us drop some polyfills and use native APIs instead.
