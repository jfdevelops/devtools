---
title: Derive a view model
description: Turn recorded entities and events into a UI-shaped view model, then read it in React or without React.
order: 20
---

The channel stores raw entities and events. A client turns them into a view model, which is the exact shape your UI wants. This guide shows how to write the reducer that does that, and how to read the result.

In this guide you will:

- Create a client with a reducer.
- Limit how many events are kept.
- Read the view model in React.
- Read the view model without React.

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

- **Create the client once, at module scope.** A client created inside a component is a new object on every render, so React resubscribes each time.
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

## Read the view model in React

Wrap the part of your app that needs the data in a `DevtoolsProvider`, and read it with `useDevtoolsViewModel`.

```tsx
// src/summary.tsx
import {
  DevtoolsProvider,
  useDevtoolsViewModel,
} from '@jfdevelops/devtools-kit-react';
import { summaryClient } from './summary-client';

type SummaryViewModel = ReturnType<typeof summaryClient.getViewModel>;

function Summary() {
  const summary = useDevtoolsViewModel<SummaryViewModel>();

  return (
    <p>
      {summary.stepCount} steps, {summary.failureCount} failures
    </p>
  );
}

export function SummaryPanel() {
  return (
    <DevtoolsProvider client={summaryClient}>
      <Summary />
    </DevtoolsProvider>
  );
}
```

The generic on `useDevtoolsViewModel<SummaryViewModel>()` is an assertion: React context carries no type, so TypeScript trusts you. [TypeScript](../typescript.md#wrap-the-context-hooks-in-typed-hooks) shows how to wrap the hook so you assert it once.

You can skip the provider by passing the client to the hook. The view model type is then inferred.

```tsx
// src/summary-direct.tsx
import { useDevtoolsViewModel } from '@jfdevelops/devtools-kit-react';
import { summaryClient } from './summary-client';

export function SummaryDirect() {
  const summary = useDevtoolsViewModel(summaryClient);

  return <p>{summary.stepCount} steps</p>;
}
```

`DevtoolsProvider` also accepts the client as `devtools`, the name used before 0.2.0. `client` and `devtools` are aliases, and you pass exactly one of them. The provider borrows the client: unmounting it removes only that provider's subscriptions and never touches the client or the channel.

Notifications arrive after a microtask, so a component re-renders just after the write that changed its data, not synchronously inside it.

## Read the view model without React

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

The listener takes no arguments. Call `getViewModel` inside it to read the current value.

## Next steps

- [Build panel tabs](./tabs.md) renders a view model as tabs.
- [Connect an existing store](./external-stores.md) builds a client from a store you already have.
- [Test a devtools integration](./testing.md) shows how to test a client in isolation.
- [`DevtoolsApi` reference](../reference/interfaces/DevtoolsApi.md) and [`Devtools` reference](../reference/classes/Devtools.md) list the exact signatures.
