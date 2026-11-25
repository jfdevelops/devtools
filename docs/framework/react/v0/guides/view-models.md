---
title: Read the view model in React
description: Read a client's view model in components with a provider and hooks, or by passing the client to a hook.
order: 10
---

A client turns recorded data into a view model. This guide shows how to read one in React components, with a provider or by passing the client to a hook.

It assumes the `summaryClient` from [Derive a view model](../../../javascript/v0/guides/view-models.md#create-a-client). A client is the read boundary a UI subscribes to: it has `subscribe` and `getViewModel`.

In this guide you will:

- Read a view model through a provider.
- Pass the client to the hook directly.
- Choose between the `client` and `devtools` props.

## Read it through a provider

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

## Pass the client to the hook

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

## Choose `client` or `devtools`

`DevtoolsProvider` also accepts the client as `devtools`, the name used before 0.2.0. `client` and `devtools` are aliases, and you pass exactly one of them. The provider borrows the client: unmounting it removes only that provider's subscriptions and never touches the client or the channel.

Notifications arrive after a microtask, so a component re-renders just after the write that changed its data, not synchronously inside it.

## Next steps

- [Build panel tabs](./tabs.md) renders a view model as tabs.
- [Inspect an existing store in React](./external-stores.md) builds a client from a store you already have.
- [Build a custom panel](./headless-panel.md) lays out the inspector with the headless primitives.
- [Test a React inspector](./testing.md) tests components that read a view model.
- [`DevtoolsProvider` reference](../plugins/react-headless.md#devtoolsprovider) lists its props.
