---
title: Connect an existing store
description: Inspect a store your library already has with createExternalStoreClient, without copying its data into the kit's channel.
order: 50
---

If your library already keeps its state in a store that other code subscribes to, you do not need to mirror that state into the kit's channel. Wrap the store in a client and give it to the panel.

In this guide you will:

- Check that your store meets the contract.
- Create a client from it.
- Render it with the provider and hooks.
- Adapt a store whose methods have other names.

## The store contract

A source has three members, described by the `ExternalStore` interface:

| Member | Meaning |
| --- | --- |
| `subscribe(listener)` | Registers a listener and returns a function that removes it. |
| `getSnapshot()` | Returns the current snapshot. |
| `getServerSnapshot()` | Optional. Returns the snapshot to use when rendering on the server. |

One rule matters more than the rest. **`getSnapshot` must return the same object until the data changes**, and `getServerSnapshot` must follow the same rule. The client compares snapshots with `Object.is` to decide whether to recompute the view model, and React compares them to decide whether to re-render. A source that builds a new object on every call defeats both. In React 18 that logs `The result of getSnapshot should be cached to avoid an infinite loop` and then throws `Maximum update depth exceeded`.

Here is a small request store that follows the contract.

```ts
// src/request-store.ts
export interface RequestEntry {
  id: string;
  url: string;
}

export interface RequestSnapshot {
  requests: readonly RequestEntry[];
}

export class RequestStore {
  #listeners = new Set<() => void>();
  #snapshot: RequestSnapshot = { requests: [] };

  subscribe(listener: () => void) {
    this.#listeners.add(listener);

    return () => {
      this.#listeners.delete(listener);
    };
  }

  getSnapshot() {
    return this.#snapshot;
  }

  add(request: RequestEntry) {
    this.#snapshot = { requests: [...this.#snapshot.requests, request] };

    for (const listener of this.#listeners) {
      listener();
    }
  }
}

export const requestStore = new RequestStore();
```

Each `add` creates a new snapshot object, and `getSnapshot` returns the same one in between. The kit calls `subscribe` and `getSnapshot` as methods on your object, so methods that use `this` work as written.

## Create a client

`createExternalStoreClient` takes the source and an optional projection. The projection turns the snapshot into the view model, and without one the view model is the snapshot itself.

```ts
// src/request-client.ts
import { createExternalStoreClient } from '@jfdevelops/devtools-kit-react/headless';
import { requestStore } from './request-store';

export const requestClient = createExternalStoreClient(
  requestStore,
  (snapshot) => snapshot.requests,
);
```

The client runs the projection once per distinct snapshot and returns the cached result until the snapshot changes. It subscribes to your store only when something subscribes to the client, and it never disposes your store. Each unsubscribe belongs to the code that subscribed. A client does not write to the global channel and does not check `IS_DEV`, so it stays live in production.

You can import `createExternalStoreClient` from `@jfdevelops/devtools-kit`, from `@jfdevelops/devtools-kit-react` or from `@jfdevelops/devtools-kit-react/headless`. They are the same function.

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

## Adapt a store with different method names

If your store's methods are named differently, pass closures that forward to them.

```ts
// src/legacy-client.ts
import { createExternalStoreClient } from '@jfdevelops/devtools-kit';

interface LegacyStore {
  listen(listener: () => void): () => void;
  current(): ReadonlyMap<string, number>;
}

export function createLegacyClient(legacy: LegacyStore) {
  return createExternalStoreClient({
    subscribe: (listener) => legacy.listen(listener),
    getSnapshot: () => legacy.current(),
  });
}
```

Keep your own protocol in the snapshot. Graph ids, edges, counts and metadata can stay in whatever shape your library already uses, because the client does not require any fields.

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

- Returning a new snapshot object on every `getSnapshot` call.
- Mutating a snapshot in place and notifying. The client sees the same object, so it keeps the old view model.
- Creating the client on every render instead of once per source.
- Passing the client to `DevtoolsStandalone`. TypeScript rejects it.

## Next steps

- [Add typed actions](./actions.md) lets the inspector send commands back to your library.
- [Persist panel preferences](./preferences.md) stores panel settings such as size.
- [Control devtools in production](./production.md) explains why external clients are always live.
- [`createExternalStoreClient` reference](../reference/functions/createExternalStoreClient.md) lists the signature.
