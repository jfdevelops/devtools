---
title: Control devtools in production
description: Choose between excluding devtools code from production bundles, shipping it as a no-op, and deliberately keeping it on.
order: 110
---

By default the kit records nothing in production. What reaches your production bundle depends on how you wrote the call sites. This guide explains the three outcomes, how to get each, and which parts of the React package check the environment.

In this guide you will:

- Exclude instrumentation from production bundles.
- Understand what an unguarded call does.
- Keep instrumentation on in production on purpose.
- Know which React exports are gated and which are not.

## How the kit decides

`IS_DEV` is exported from `@jfdevelops/devtools-kit`. It is `process.env.NODE_ENV !== 'production'`. Bundlers replace `process.env.NODE_ENV` with a string literal in a production build, so `IS_DEV` becomes `false` and any block guarded by it is dead code. This only works if your bundler replaces `process.env.NODE_ENV`; see [Installation](../installation.md#replace-processenvnode_env-in-your-bundler).

`createDevtools` also takes an `enabled` option that defaults to `IS_DEV`. When `enabled` is `false`, `putEntity`, `removeEntity` and `emit` return immediately, and no channel is installed.

## Exclude call sites from the bundle

Put the creation and the calls inside `if (IS_DEV)`. A production bundler removes the whole block, including the key and the payloads.

```ts
// src/excluded.ts
import { createDevtools, IS_DEV } from '@jfdevelops/devtools-kit';

if (IS_DEV) {
  const devtools = createDevtools({
    key: '__WIZARD_DEVTOOLS__',
    entities: {},
  });

  devtools.emit('wizard-started');
}
```

The kit's tests build this code with Vite in production mode, minified, and check that the key, the payload and the string `putEntity` are all absent from the output.

This is the only outcome that removes code. Guarding only the call sites, with `createDevtools` in a separate module, removes the calls. The separate module and its schemas are removed only if your bundler can tree-shake it, so check your own bundle.

## What an unguarded call does

If you call the API without a guard, the code ships but does nothing.

```ts
// src/no-op.ts
import { createDevtools } from '@jfdevelops/devtools-kit';

const devtools = createDevtools({ key: '__WIZARD_DEVTOOLS__', entities: {} });

devtools.emit('wizard-started'); // ignored in production

export const events = devtools
  .createClient((snapshot) => snapshot.events)
  .getViewModel(); // [] in production
```

In a production build no global is installed under the key, and a client created from this API returns your reducer's result for empty data. This is the safe default for code that is cheap to keep.

## Keep devtools on in production

Pass `enabled: true` to keep recording in production. Use it for a debug mode you switch on deliberately, not as a default.

```ts
// src/opt-in.ts
import { createDevtools, IS_DEV } from '@jfdevelops/devtools-kit';

const isDebugSession = new URLSearchParams(location.search).has('debug');

export const devtools = createDevtools({
  key: '__WIZARD_DEVTOOLS__',
  entities: {},
  enabled: IS_DEV || isDebugSession,
});
```

With `enabled: true`, a production build records events and a client reads them back. The kit's tests build this case too and read `['production-event']` back from a production bundle.

Two side effects follow from opting in. Validation also runs, if you turned `validate` on. And the channel, which is a global on `globalThis`, is readable by any script on the page that knows the key, so do not record anything you would not show to every script on that page.

`enabled: false` is the opposite: it also turns recording off in development.

## Render the panel in production

In the React package, only `DevtoolsStandalone` checks the environment. It renders `null` unless `enabled` is `true`, and the default for `enabled` is "not a production build".

```tsx
// src/debug-devtools.tsx
import { DevtoolsStandalone } from '@jfdevelops/devtools-kit-react';
import { client } from './client';
import { eventsTab, stepsTab } from './tabs';

export function DebugDevtools({ enabled }: { enabled: boolean }) {
  return (
    <DevtoolsStandalone
      devtools={client}
      tabs={[stepsTab, eventsTab]}
      enabled={enabled}
    />
  );
}
```

Everything else renders wherever you put it. `DevtoolsPanel`, `DevtoolsProvider`, the hooks and the headless primitives have no production gate. With a channel-backed client they simply show empty data when instrumentation is off, but they still ship and render. If you do not want them in production, render them behind your own condition, or exclude the module that imports them.

External-store clients, from [`createExternalStoreClient`](./external-stores.md), are always live. They read a source you own, so they have nothing to turn off.

## Summary

| You write | In a production build |
| --- | --- |
| Creation and calls inside `if (IS_DEV)` | The code is removed. |
| Unguarded calls, default `enabled` | The code ships, nothing records and no global is installed. |
| `enabled: true` | Recording works. |
| `<DevtoolsStandalone />` | Renders nothing, unless `enabled` is `true`. |
| `<DevtoolsPanel />` or the headless primitives | Render normally. |
| `createExternalStoreClient` | Works normally. |

## Next steps

- [Instrument a library](./instrument-a-library.md) shows how to write guarded call sites.
- [Add the standalone panel](./standalone-panel.md) covers the `enabled` prop in context.
- [Troubleshooting](./troubleshooting.md) covers an empty panel in production.
