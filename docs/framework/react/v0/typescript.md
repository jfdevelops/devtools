---
title: TypeScript
description: Where React context cannot check types, how to wrap the hooks in typed hooks, and what the presets require of a Devtools instance.
order: 50
---

Types flow from your schemas as the [TypeScript](../../javascript/v0/typescript.md) page in the JavaScript docs explains. This page covers what React context cannot check.

## Unchecked generics in React

React context carries no type information, so a few hooks take a generic that you assert:

| Hook | Generic you assert |
| --- | --- |
| `useDevtools<VM>()` | The view model of the nearest provider's client. |
| `useOptionalDevtools<VM>()` | The same, or `null` without a provider. |
| `useDevtoolsViewModel<VM>()` | The same. |
| `useDevtoolsActions<Actions>()` | The contract of the adapter the provider received. |

Nothing checks these against the provider. If you assert the wrong type, the code compiles and fails when it runs. Passing an instance, as in `useDevtoolsViewModel(client)`, infers the type from that instance instead.

`DevtoolsPanel` has the same limit. When it reads from a provider rather than from its `devtools` prop, its tabs' view model type is not checked against the provider's client.

## Wrap the context hooks in typed hooks

Assert each type once, in your devtools package, and give the rest of your code a typed hook.

```ts
// src/wizard-hooks.ts
import {
  useDevtoolsActions,
  useDevtoolsViewModel,
} from '@jfdevelops/devtools-kit-react/headless';
import type { WizardViewModel } from './client';

export type WizardActions = {
  jumpTo: (id: string) => Promise<void>;
};

export function useWizardViewModel() {
  return useDevtoolsViewModel<WizardViewModel>();
}

export function useWizardActions() {
  return useDevtoolsActions<WizardActions>();
}
```

Components then call `useWizardViewModel()` and `useWizardActions()` and never repeat the generic.

## Tab factories need the view model type

`createEventLogTab` and `createDiagnosticsTab` take the view model as a type parameter. TypeScript does not infer it from the surrounding `tabs` array, so pass it yourself, or annotate the variable:

```ts
const eventsTab = createEventLogTab<WizardViewModel>({
  select: (vm) => vm.events.map((event) => ({ type: event.type, at: event.at })),
});
```

Without the type argument, `vm` is `unknown` inside `select`.

## The presets need a `Devtools` instance

The `devtools` prop of `DevtoolsStandalone` and `DevtoolsPanel` is typed as the `Devtools` class, which is what `createClient` returns. A client from `createExternalStoreClient` is a plain `DevtoolsClient`, so TypeScript rejects it there. See [What the preset does not support](./guides/standalone-panel.md#what-the-preset-does-not-support).

```tsx
// src/external-standalone.tsx
import {
  createExternalStoreClient,
  DevtoolsStandalone,
} from '@jfdevelops/devtools-kit-react';

const external = createExternalStoreClient({
  getSnapshot: () => ({ events: [] }),
  subscribe: () => () => {},
});

export function ExternalStandalone() {
  // @ts-expect-error `devtools` needs a `Devtools` instance, not an external-store client.
  return <DevtoolsStandalone devtools={external} tabs={[]} />;
}
```

The provider's `client` prop, and `useDevtoolsViewModel`, accept any `DevtoolsClient`, which is why external stores work through the provider.

`Devtools` is typed nominally, so two installed copies of the core are not interchangeable. See [Keep one copy of the core installed](../../javascript/v0/typescript.md#keep-one-copy-of-the-core-installed).

## Next steps

- [Call actions from React](./guides/actions.md) covers action contracts in components.
- [Build panel tabs](./guides/tabs.md) covers the tab types.
- [React headless reference](./plugins/react-headless.md) lists the hooks and their generics.
- The [TypeScript](../../javascript/v0/typescript.md) page in the JavaScript docs covers types inferred from schemas.
