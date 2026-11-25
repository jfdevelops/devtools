---
title: Instrument a library
description: Describe a library's data with schemas, report entities and events safely, and validate payloads during development.
order: 10
---

Instrumenting means describing the data your library exposes and reporting it at the points where it changes. You do this with `createDevtools`, and everything the devtools package later shows comes from what you record here.

In this guide you will:

- Create one typed devtools module for your library.
- Report entities and events from library code.
- Generate ids for things that have none.
- Turn on payload validation while you develop.

This guide assumes you have installed the packages from [Installation](../installation.md) and read [Core concepts](../concepts.md).

## Create the devtools module

Create one module per library that calls `createDevtools` once and exports the result. Every other file in the library imports it from there.

```ts
// src/devtools.ts
import { z } from 'zod';
import { createDevtools } from '@jfdevelops/devtools-kit';

export const devtools = createDevtools({
  key: '__WIZARD_DEVTOOLS__',
  entities: {
    step: z.object({
      id: z.string(),
      title: z.string(),
      visits: z.number(),
    }),
  },
  events: z.discriminatedUnion('type', [
    z.object({ type: z.literal('step:enter'), at: z.number(), id: z.string() }),
    z.object({
      type: z.literal('validation:fail'),
      at: z.number(),
      id: z.string(),
      message: z.string(),
    }),
  ]),
});
```

`createDevtools` takes these options:

| Option | Meaning |
| --- | --- |
| `key` | The global name the channel is stored under. It must be unique. A name such as `'__MY_LIBRARY_DEVTOOLS__'` is conventional. |
| `entities` | One schema per collection of long-lived items. Use `{}` if the library only reports events. |
| `events` | A schema for the event stream, usually a discriminated union on `type`. |
| `validate` | Warn when a payload fails its schema. Off by default. |
| `enabled` | Whether instrumentation records. Defaults to `IS_DEV`. |

Any Standard Schema value works for `entities` and `events`, not only Zod. You write no type arguments. `putEntity` accepts only your collection names with that collection's data type, and `emit` accepts only your event type.

If you leave out `events`, `emit` accepts `unknown`. Declare the schema when you want type checking on events.

## Report entities

Call `putEntity` when an entity is created or changes, and `removeEntity` when it goes away.

```ts
// src/steps.ts
import { IS_DEV } from '@jfdevelops/devtools-kit';
import { devtools } from './devtools';

export function trackStep(id: string, title: string, visits: number) {
  if (IS_DEV) {
    devtools.putEntity('step', id, { id, title, visits });
  }
}

export function forgetStep(id: string) {
  if (IS_DEV) {
    devtools.removeEntity('step', id);
  }
}
```

`putEntity` inserts a new entity or replaces the one with the same id in that collection. Replacing an entity writes the whole value, so pass the complete entity each time, not a patch. The entity keeps its position in the snapshot's array when you replace it. If you remove an entity and put the same id again, it goes to the end.

## Report events

Call `emit` for things that happened rather than things that exist.

```ts
// src/events.ts
import { IS_DEV } from '@jfdevelops/devtools-kit';
import { devtools } from './devtools';

export function reportValidationFailure(id: string, message: string) {
  if (IS_DEV) {
    devtools.emit({ type: 'validation:fail', at: Date.now(), id, message });
  }
}
```

The channel keeps only the newest events. The default limit is 200, and you can change it from the client side with `maxEvents`, as [Derive a view model](./view-models.md#limit-how-many-events-are-kept) explains. The kit does not add timestamps. Include an `at` field in your event schema if your UI needs a time for each event.

## Generate ids

Some things you want to report have no natural id. The devtools API generates them.

```ts
// src/ids.ts
import { devtools } from './devtools';

const formOwner = Symbol('form');

export const first = devtools.nextId('step'); // 'step-1'
export const second = devtools.nextId('step'); // 'step-2'
export const owner = devtools.ownerId(formOwner); // 'owner-3'
export const sameOwner = devtools.ownerId(formOwner); // 'owner-3'
```

`nextId(prefix)` returns `` `${prefix}-${n}` `` from a counter. `ownerId(token)` returns the same string every time for the same `symbol`, so a `symbol` can identify an object without exposing it. Both draw from one counter.

The counter belongs to one `createDevtools` call, not to the whole process. Two different `createDevtools` calls can both return `step-1`, and re-evaluating the module, for example on a hot reload, starts the counter again. If you need ids that are unique across channels, add your own prefix.

## Keep call sites out of production bundles

Wrap every call in `if (IS_DEV)`, as the examples above do. A bundler that replaces `process.env.NODE_ENV` turns `IS_DEV` into `false` and removes the block. Without the guard, the calls ship to production and do nothing. [Control devtools in production](./production.md) covers the difference and how to opt in.

The kit's tests verify the case where `createDevtools` and the calls are inside the same `if (IS_DEV)` block. When the module that creates `devtools` is separate, as above, the call sites are removed but the schemas and the `createDevtools` call are removed only if your bundler can tree-shake the module. Check your own production bundle if size matters.

## Validate payloads while you develop

TypeScript checks what you pass at compile time. Schemas can also check things types cannot, such as a minimum length. Turn on `validate` to check each payload at runtime.

```ts
// src/validated.ts
import { z } from 'zod';
import { createDevtools } from '@jfdevelops/devtools-kit';

const devtools = createDevtools({
  key: '__WIZARD_VALIDATED_DEVTOOLS__',
  entities: {
    step: z.object({ id: z.string().min(1), title: z.string() }),
  },
  validate: true,
});

// Type-checks, but the id is empty. This logs:
// [devtools-kit] entity "step" failed schema validation  (issues) (value)
devtools.putEntity('step', '', { id: '', title: 'Account' });
```

When a payload fails, the kit calls `console.warn` with the message and then the schema's `issues` and the value. For an event the message is `[devtools-kit] event failed schema validation`. The payload is still recorded: validation reports problems and never blocks a write.

A few details:

- Validation is synchronous. If a schema is asynchronous, the kit skips it and warns `[devtools-kit] async schema for entity "step" was skipped`, or `async schema for event was skipped` for the event schema.
- Validation runs whenever instrumentation is enabled, including in production if you set `enabled: true`.
- The value you pass is typed as the schema's output but validated as the schema's input. For a schema with a transform or a default, those differ, so leave `validate` off for it.

## Failures never reach your users

Every write to the channel, and every validation, runs inside a `try` and `catch` that swallows errors. A fault in devtools instrumentation cannot throw into the app that uses your library. The cost is that a failing write is always silent. `validate` only reports payloads that do not match their schema, and does not report write failures.

## Next steps

- [Derive a view model](./view-models.md) reads this data back out.
- [Control devtools in production](./production.md) explains `IS_DEV` and `enabled`.
- [TypeScript](../typescript.md) explains how the schema types flow.
- [`createDevtools` reference](../reference/functions/createDevtools.md) lists the full options.
