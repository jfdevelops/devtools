# @jfdevelops/devtools-kit-react

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

### Patch Changes

- Updated dependencies [25938c9]
  - @jfdevelops/devtools-kit@0.1.0
