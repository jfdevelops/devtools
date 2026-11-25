---
title: TypeScript
description: Which types the kit infers from your schemas, which you assert yourself, and how to keep the unchecked parts safe.
order: 50
---

The kit is built so that you write schemas once and TypeScript derives the rest. This page explains what is inferred, what is only asserted, and where the type system cannot protect you.

## Types come from schemas

`createDevtools` reads the type of each entity and event from the schema you pass, so you write no type arguments.

```ts
// src/inference.ts
import { devtools } from './devtools';

devtools.putEntity('step', 'account', {
  id: 'account',
  title: 'Account',
  visits: 1,
});

// @ts-expect-error 'checkout' is not a collection declared in `entities`.
devtools.putEntity('checkout', 'a', {});

// @ts-expect-error The `step` schema requires `visits`.
devtools.putEntity('step', 'account', { id: 'account', title: 'Account' });
```

Three types flow from your arguments:

- `putEntity` and `removeEntity` accept only the keys of `entities`, and `putEntity` takes the matching schema's type for its data.
- `emit` takes the type of the `events` schema. With no `events` schema it takes `unknown`.
- A client's reducer receives a snapshot whose `entities` has one read-only array per declared collection, and whose `events` is a read-only array of your event type. The view model's type is whatever the reducer returns.

If you need to name the view model, take it from the client:

```ts
type WizardViewModel = ReturnType<typeof client.getViewModel>;
```

## Output types, not input types

The types are the schemas' output types. For most schemas input and output are the same. For a schema with a transform or a default, they are not, and the output type is what `putEntity` and `emit` require.

```ts
// src/transform.ts
import { z } from 'zod';
import { createDevtools } from '@jfdevelops/devtools-kit';

const devtools = createDevtools({
  key: '__SESSION_DEVTOOLS__',
  entities: {
    session: z.object({
      id: z.string(),
      startedAt: z.string().transform((value) => new Date(value)),
    }),
  },
});

// `startedAt` is a `Date`, the schema's output type.
devtools.putEntity('session', 'a', { id: 'a', startedAt: new Date() });
```

The `validate` option runs your schema on the value you pass, as input. For a schema like this one it would warn about a `Date` where it expects a string, so leave `validate` off for schemas with transforms.

## Write helpers around `createDevtools`

If you wrap `createDevtools` in a helper, constrain the entities with `EntitySchemas` and let TypeScript infer the return type, so the caller's schemas flow through the type parameter. The `const` modifier matches `createDevtools` itself and keeps the schema object literal.

```ts
// src/feature-devtools.ts
import { createDevtools, type EntitySchemas } from '@jfdevelops/devtools-kit';

export function createFeatureDevtools<const E extends EntitySchemas>(
  feature: string,
  entities: E,
) {
  return createDevtools({ key: `__${feature}_DEVTOOLS__`, entities });
}
```

`StandardSchemaV1` is re-exported from `@jfdevelops/devtools-kit` for helpers that accept any schema.

## Actions

An action contract is a type that maps names to functions. `createActionClient` infers it from the adapter you pass, and `execute` then checks its arguments against the contract and returns a promise of the awaited result. See [Add typed actions](./guides/actions.md).

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

`Devtools` has private (`#`) members, so TypeScript treats it nominally. If your dependency tree contains two installed copies of `@jfdevelops/devtools-kit`, a `Devtools` from one is not assignable to the other's. Keep a single copy installed. The runtime channel still works across copies, because it is shared through the global key.

## Next steps

- [Instrument a library](./guides/instrument-a-library.md) shows the inferred API in use.
- [Add typed actions](./guides/actions.md) covers action contracts.
- [Build panel tabs](./guides/tabs.md) covers the tab types.
- The [core API reference](./reference/index.md) lists every exported type.
