---
title: Control the panel in production
description: Learn which React exports check the environment, how DevtoolsStandalone is gated, and which components render normally in production.
order: 100
---

The kit records nothing in production by default: instrumentation is excluded, a no-op, or switched on deliberately, as [Control devtools in production](../../../javascript/v0/guides/production.md) explains. This guide covers what the React components do in a production build.

In this guide you will:

- See which React export checks the environment.
- Render the standalone panel in production on purpose.
- Know which components render normally.

## Only `DevtoolsStandalone` checks the environment

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

External-store clients are always live, as [Control devtools in production](../../../javascript/v0/guides/production.md#external-store-clients-are-always-live) explains.

## Summary

| You write | In a production build |
| --- | --- |
| Instrumentation | See [Control devtools in production](../../../javascript/v0/guides/production.md). |
| `<DevtoolsStandalone />` | Renders nothing, unless `enabled` is `true`. |
| `<DevtoolsPanel />` or the headless primitives | Render normally. |

## Next steps

- [Add the standalone panel](./standalone-panel.md) covers the `enabled` prop in context.
- [Troubleshooting](./troubleshooting.md) covers an empty panel in production.
- [Control devtools in production](../../../javascript/v0/guides/production.md) covers excluding and enabling instrumentation.
