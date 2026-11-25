---
title: Connect an existing store
description: Inspect a store your library already has with createExternalStoreClient, without copying its data into the kit's channel.
order: 30
---

If your library already keeps its state in a store that other code subscribes to, you do not need to mirror that state into the kit's channel. Wrap the store in a client and give it to your UI.

In this guide you will:

- Check that your store meets the contract.
- Create a client from it.
- Read the client.
- Adapt a store whose methods have other names.

## The store contract

A source has three members, described by the `ExternalStore` interface:

| Member | Meaning |
| --- | --- |
| `subscribe(listener)` | Registers a listener and returns a function that removes it. |
| `getSnapshot()` | Returns the current snapshot. |
| `getServerSnapshot()` | Optional. Returns the snapshot to use when rendering on the server. |

One rule matters more than the rest. **`getSnapshot` must return the same object until the data changes**, and `getServerSnapshot` must follow the same rule. The client compares snapshots with `Object.is` to decide whether to recompute the view model, and a UI framework compares them to decide whether to re-render. A source that builds a new object on every call defeats both. In React this causes a render loop; see the [React troubleshooting](../../../react/v0/guides/troubleshooting.md#the-result-of-getsnapshot-should-be-cached-to-avoid-an-infinite-loop) entry.

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
import { createExternalStoreClient } from '@jfdevelops/devtools-kit';
import { requestStore } from './request-store';

export const requestClient = createExternalStoreClient(
  requestStore,
  (snapshot) => snapshot.requests,
);
```

The client runs the projection once per distinct snapshot and returns the cached result until the snapshot changes. It subscribes to your store only when something subscribes to the client, and it never disposes your store. Each unsubscribe belongs to the code that subscribed. A client does not write to the global channel and does not check `IS_DEV`, so it stays live in production.

The React package re-exports `createExternalStoreClient`, so you can also import it from there. It is the same function.

Create one client per source. A client caches by snapshot identity, so creating a new client on every read, or on every render in a UI framework, throws that cache away and gives subscribers a new object each time.

## Read the client

The client has the same `subscribe` and `getViewModel` as a channel client, so you read it the same way. See [Read the view model](./view-models.md#read-the-view-model). It also has `getServerViewModel`, which uses your `getServerSnapshot` when the source has one and `getViewModel` otherwise.

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

## Common mistakes

- Returning a new snapshot object on every `getSnapshot` call.
- Mutating a snapshot in place and notifying. The client sees the same object, so it keeps the old view model.

## Next steps

- [Add typed actions](./actions.md) lets the inspector send commands back to your library.
- [Persist preferences](./preferences.md) stores settings such as panel size.
- [Control devtools in production](./production.md) explains why external clients are always live.
- [Inspect an existing store in React](../../../react/v0/guides/external-stores.md) renders this client with the provider and hooks.
- [`createExternalStoreClient` reference](../reference/functions/createExternalStoreClient.md) lists the signature.
