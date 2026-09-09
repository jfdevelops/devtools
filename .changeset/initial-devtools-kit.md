---
"@jfdevelops/devtools-kit": minor
"@jfdevelops/devtools-kit-react": minor
---

Initial release.

- `@jfdevelops/devtools-kit` — a dev-only `globalThis` channel (typed entity
  collections + a bounded event stream), a memoised `Devtools` client, and
  `createDevtoolsChannelApi()` as the typed instrumentation surface. No-op and
  dead-code-eliminated in production.
- `@jfdevelops/devtools-kit-react` — `DevtoolsProvider`, `useDevtools` /
  `useDevtoolsViewModel`, a tab-driven `DevtoolsPanel`, built-in event-log and
  diagnostics tab factories, and `DevtoolsStandalone` (a Shadow-DOM floating
  panel). Renders nothing in production.
