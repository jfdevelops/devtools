---
"@jfdevelops/devtools-kit": patch
---

Fix `IS_DEV` reading as `false` in browsers without a `process` polyfill (Vite's
default), which silently disabled devtools everywhere but Node. Drop the
`typeof process` short-circuit so bundlers can substitute `process.env.NODE_ENV`
directly — still `false` (and DCE-friendly) in production.
