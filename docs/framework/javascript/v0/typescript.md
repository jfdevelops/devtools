---
title: TypeScript
description: Which types the kit infers from your schemas, which you assert yourself, and how to keep a single copy of the core installed.
order: 50
---

The kit is built so that you write schemas once and TypeScript derives the rest. This page explains what is inferred and where the type system cannot protect you. The React package adds a few unchecked generics, covered on the React [TypeScript](../../react/v0/typescript.md) page.

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

## Keep one copy of the core installed

The `Devtools` class, which `createClient` returns, has private (`#`) members, so TypeScript treats it nominally. If your dependency tree contains two installed copies of `@jfdevelops/devtools-kit`, a `Devtools` from one is not assignable to the other's. Keep a single copy installed.

The channel itself still works across copies, because it is shared through the global key. Class identity does not. The React provider builds its action client from the copy of the core that the React package depends on, so an `UnavailableActionError` it throws fails `instanceof` against a class imported from another copy, and your `catch` takes the wrong branch. In React code, import `UnavailableActionError` from `@jfdevelops/devtools-kit-react` or `@jfdevelops/devtools-kit-react/headless`, which re-export the copy the provider uses.

To align the copies, install the exact core version the React package depends on, then check with `npm ls @jfdevelops/devtools-kit` or `pnpm why @jfdevelops/devtools-kit`. If more than one version appears, dedupe them with your package manager.

## Next steps

- [Instrument a library](./guides/instrument-a-library.md) shows the inferred API in use.
- [Add typed actions](./guides/actions.md) covers action contracts.
- The [core API reference](./reference/index.md) lists every exported type.
- The React [TypeScript](../../react/v0/typescript.md) page covers the generics React context cannot check.
