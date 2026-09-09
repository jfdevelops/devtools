---
"@jfdevelops/devtools-kit": patch
---

Fix `IS_DEV` reading as `false` in browsers without a `process` polyfill (Vite's
default), which silently disabled devtools everywhere but Node. It now defaults
to dev and only reads `false` when a bundler has substituted
`process.env.NODE_ENV` with `"production"`.
