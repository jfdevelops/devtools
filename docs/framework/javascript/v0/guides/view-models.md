---
title: Derive a view model
description: Turn recorded entities and events into a UI-shaped view model, then read it from any UI.
order: 20
---

The channel stores raw entities and events. A client turns them into a view model, which is the exact shape your UI wants. This guide shows how to write the reducer that does that, and how to read the result.

In this guide you will:

- Create a client with a reducer.
- Limit how many events are kept.
- Check whether recording is active.
- Read the view model.

## Create a client

Call `createClient` on the object returned by `createDevtools`. Pass a reducer: a function from the snapshot to your view model.

```ts
// src/summary-client.ts
import { devtools } from './devtools';

export const summaryClient = devtools.createClient((snapshot) => ({
  stepCount: snapshot.entities.step.length,
  failureCount: snapshot.events.filter(
    (event) => event.type === 'validation:fail',
  ).length,
}));
```

TypeScript infers the view model from what the reducer returns, and the snapshot's types from your schemas. Every collection you declared is a non-optional array, even before the first `putEntity`: the client fills in a missing collection with an empty array before it calls your reducer, so you do not need `?? []`.

Two rules keep clients cheap:

- **Create the client once, at module scope.** A client created inside a component or a function is a new object on every call, so a UI framework resubscribes each time.
- **Keep the reducer pure.** The client remembers the last view model and recomputes it only when the snapshot changes, so the same snapshot always gives the same object. A reducer that reads a clock, a random number or other outside state returns a stale value.

## Limit how many events are kept

The channel keeps the newest 200 events. Pass `maxEvents` to change the limit.

```ts
// src/long-history-client.ts
import { devtools } from './devtools';

export const longHistoryClient = devtools.createClient(
  (snapshot) => snapshot.events,
  { maxEvents: 1000 },
);
```

`maxEvents` is set on the shared channel, not on your client. It changes the cap for the producer and for every other reader of the same key. If two clients ask for different limits, whichever is created last wins. Lowering the cap trims the stored events at the next `emit`, not immediately.

## Check whether recording is active

A client exposes `isActive`, which is `true` when it found a channel. In a production build with the default settings there is no channel, so `isActive` is `false`, `getViewModel` returns your reducer's result for empty data, and `subscribe` does nothing. You can render a message such as "Devtools are not recording" from it.

## Read the view model

A client is plain JavaScript. Use `subscribe` and `getViewModel` from any framework.

```ts
// src/subscribe.ts
import { summaryClient } from './summary-client';

const unsubscribe = summaryClient.subscribe(() => {
  console.log(summaryClient.getViewModel().failureCount);
});

// Later, when you no longer need updates:
unsubscribe();
```

The listener takes no arguments. Call `getViewModel` inside it to read the current value. Notifications arrive after a microtask, so a listener runs just after the write that changed the data, not synchronously inside it.

## Next steps

- [Connect an existing store](./external-stores.md) builds a client from a store you already have.
- [Test instrumentation and clients](./testing.md) shows how to test a client in isolation.
- [Read the view model in React](../../../react/v0/guides/view-models.md) reads a client from a provider and hooks.
- [`DevtoolsApi` reference](../reference/interfaces/DevtoolsApi.md) and [`Devtools` reference](../reference/classes/Devtools.md) list the exact signatures.
