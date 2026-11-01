# @jfdevelops/devtools-kit

## 0.2.0

### Minor Changes

- 00e74be: Add borrowed external-store clients, typed optional actions, explicit preference storage and production opt-in. Add a CSS-free headless React entry with composable visibility, focus, geometry, docking, tabs and explicit hosts. Keep legacy panel and provider exports compatible and build the standalone preset on headless visibility primitives.

  The React context hooks now return the structural DevtoolsClient type. Consumers calling channel-only methods through context should keep their original Devtools instance for those calls.

## 0.1.1

### Patch Changes

- 9b80d1b: Fix `IS_DEV` reading as `false` in browsers without a `process` polyfill (Vite's
  default), which silently disabled devtools everywhere but Node. Drop the
  `typeof process` short-circuit so bundlers can substitute `process.env.NODE_ENV`
  directly — still `false` (and DCE-friendly) in production.

## 0.1.0

### Minor Changes

- 25938c9: Initial release.

  - `@jfdevelops/devtools-kit` — a dev-only `globalThis` channel (typed entity
    collections + a bounded event stream), a memoised `Devtools` client, and
    `createDevtools({ key, entities, events })` which takes a
    [Standard Schema](https://standardschema.dev) description (Zod, Valibot,
    ArkType, …) and infers every payload type — no generics. Optional dev-time
    payload validation. No-op and dead-code-eliminated in production.
  - `@jfdevelops/devtools-kit-react` — `DevtoolsProvider`, `useDevtools` /
    `useDevtoolsViewModel`, a tab-driven `DevtoolsPanel`, built-in event-log and
    diagnostics tab factories, and `DevtoolsStandalone` (a Shadow-DOM floating
    panel). Renders nothing in production.
