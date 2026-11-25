---
title: Inspect an existing store in React
description: Render a client built from an existing store with the provider and hooks, and use it with the styled panel.
order: 40
---

If you have wrapped a store your library already has in a client, render it with a provider and hooks. The store is not copied into the kit's channel.

This guide assumes `src/request-store.ts` and `src/request-client.ts` from [Connect an existing store](../../../javascript/v0/guides/external-stores.md). Create one client per source, as that guide explains.

In this guide you will:

- Render the client with the provider.
- Create the client once per source.
- Use it with the styled panel.

## Render it with the provider

Bind the client to a subtree with `DevtoolsProvider`, and read it with `useDevtoolsViewModel`.

```tsx
// src/request-inspector.tsx
import {
  DevtoolsProvider,
  useDevtoolsViewModel,
} from '@jfdevelops/devtools-kit-react/headless';
import { requestClient } from './request-client';
import type { RequestEntry } from './request-store';

export function RequestList() {
  const requests = useDevtoolsViewModel<readonly RequestEntry[]>();

  return (
    <ul>
      {requests.map((request) => (
        <li key={request.id}>{request.url}</li>
      ))}
    </ul>
  );
}

export function RequestInspector() {
  return (
    <DevtoolsProvider client={requestClient}>
      <RequestList />
    </DevtoolsProvider>
  );
}
```

On the server, the hook uses the client's `getServerViewModel`, which comes from your `getServerSnapshot`. If your store has none, it uses `getViewModel`.

Two providers with two different clients are fully independent. You can render a request inspector and a graph inspector side by side, each with its own source.

## Create the client once per source

If the store is created inside a component, create the client with `useMemo`, keyed on the store. Creating it on each render gives React a new client every time.

```tsx
// src/store-devtools.tsx
import { useMemo } from 'react';
import {
  createExternalStoreClient,
  DevtoolsProvider,
} from '@jfdevelops/devtools-kit-react/headless';
import { RequestList } from './request-inspector';
import type { RequestStore } from './request-store';

export function StoreDevtools({ store }: { store: RequestStore }) {
  const client = useMemo(
    () => createExternalStoreClient(store, (snapshot) => snapshot.requests),
    [store],
  );

  return (
    <DevtoolsProvider client={client}>
      <RequestList />
    </DevtoolsProvider>
  );
}
```

## Use it with the styled panel

`DevtoolsStandalone` cannot take an external-store client. See [What the preset does not support](./standalone-panel.md#what-the-preset-does-not-support).

`DevtoolsPanel` can read an external-store client through a provider.

```tsx
// src/request-panel.tsx
import {
  DevtoolsPanel,
  DevtoolsProvider,
  type DevtoolsTab,
} from '@jfdevelops/devtools-kit-react';
import { requestClient } from './request-client';
import type { RequestEntry } from './request-store';

const requestsTab: DevtoolsTab<readonly RequestEntry[]> = {
  id: 'requests',
  label: 'Requests',
  count: (requests) => requests.length,
  render: (requests) => (
    <ul>
      {requests.map((request) => (
        <li key={request.id}>{request.url}</li>
      ))}
    </ul>
  ),
};

export function RequestPanel() {
  return (
    <DevtoolsProvider client={requestClient}>
      <DevtoolsPanel tabs={[requestsTab]} />
    </DevtoolsProvider>
  );
}
```

A `DevtoolsPanel` that reads from a provider does not check its tabs' view model type against the provider's client. Keep them in sync yourself.

For a floating, draggable panel around an external store, compose your own with the primitives in [Build a custom panel](./headless-panel.md).

## Common mistakes

- Returning a new snapshot object on each `getSnapshot` call. This causes the infinite-loop error described in [Troubleshooting](./troubleshooting.md#the-result-of-getsnapshot-should-be-cached-to-avoid-an-infinite-loop).
- Creating the client on every render instead of once per source. The hook then sees a new client each time, so it discards the cached view model and resubscribes on every render.
- Passing the client to `DevtoolsStandalone`. TypeScript rejects it.

## Next steps

- [Call actions from React](./actions.md) lets the inspector send commands back to your library.
- [Build a custom panel](./headless-panel.md) lays out the inspector.
- [Persist panel layout](./preferences.md) stores the panel's size and position.
- [Connect an existing store](../../../javascript/v0/guides/external-stores.md) covers the store contract and the client.
