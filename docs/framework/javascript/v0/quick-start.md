---
title: Quick start
description: Instrument a small wizard library and show its steps and events in a plain DOM inspector that updates live, in five steps.
order: 30
---

In this tutorial you instrument a small library that walks users through a wizard, then read its data in a plain DOM inspector. At the end, two buttons in your app record steps and validation failures, and a list on the page updates as they happen. No UI framework is involved.

The tutorial uses one project and three roles in it: a wizard library that records data, an inspector that renders it, and an app. In a real project the library and its devtools usually live in separate packages. [Core concepts](./concepts.md) explains the split.

## Prerequisites

- A browser app with a bundler that replaces `process.env.NODE_ENV`, such as Vite. See [Installation](./installation.md).
- The packages from [Installation](./installation.md): `@jfdevelops/devtools-kit` and `zod`.

## 1. Describe the library's data

Create `src/devtools.ts`. Call `createDevtools` once, with a unique `key` and a schema for each kind of data. The wizard records one entity, a step, and two kinds of event.

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

The `key` is the name of a global the data is stored under, so it must be unique across everything on the page. You wrote no type arguments: the types of `putEntity` and `emit` now come from the schemas.

## 2. Report data from the library

Create `src/wizard.ts`. Report the data where it happens, inside `if (IS_DEV)`. Production bundlers remove the guarded code.

```ts
// src/wizard.ts
import { IS_DEV } from '@jfdevelops/devtools-kit';
import { devtools } from './devtools';

export interface Step {
  id: string;
  title: string;
}

const visits = new Map<string, number>();

export function enterStep(step: Step) {
  const count = (visits.get(step.id) ?? 0) + 1;

  visits.set(step.id, count);

  if (IS_DEV) {
    devtools.putEntity('step', step.id, { ...step, visits: count });
    devtools.emit({ type: 'step:enter', at: Date.now(), id: step.id });
  }
}

export function failValidation(step: Step, message: string) {
  if (IS_DEV) {
    devtools.emit({
      type: 'validation:fail',
      at: Date.now(),
      id: step.id,
      message,
    });
  }
}
```

`putEntity` inserts or replaces the step with that id. `emit` appends to the event log. Both are type-checked: passing `{ ...step }` without `visits`, or an event with an unknown `type`, is a compile error.

You can check the recording before building any UI. Call `enterStep({ id: 'account', title: 'Account' })` from your app's entry file, start the app in development, and evaluate `__WIZARD_DEVTOOLS__.getSnapshot()` in the browser console. The snapshot contains the `account` step and one `step:enter` event.

## 3. Turn the data into a view model

The inspector reads the data through a client. Create `src/client.ts`. The function you pass to `createClient` is a reducer: it receives the raw snapshot and returns whatever shape your UI wants.

```ts
// src/client.ts
import { devtools } from './devtools';

export const client = devtools.createClient((snapshot) => ({
  steps: snapshot.entities.step,
  events: snapshot.events,
}));

export type WizardViewModel = ReturnType<typeof client.getViewModel>;
```

Create the client once, at module scope, as here. `snapshot.entities.step` is always an array, even before the first `putEntity`, so the reducer needs no fallback.

## 4. Render the view model

Create `src/inspector.ts`. `mountInspector` builds a list and a count with DOM calls, fills them from the view model, and re-renders whenever the data changes.

```ts
// src/inspector.ts
import { client } from './client';

export function mountInspector(container: HTMLElement) {
  const steps = document.createElement('ul');
  const summary = document.createElement('p');

  container.append(steps, summary);

  function render() {
    const { steps: stepList, events } = client.getViewModel();

    steps.replaceChildren(
      ...stepList.map((step) => {
        const item = document.createElement('li');

        item.textContent = `${step.title}, visits: ${step.visits}`;

        return item;
      }),
    );
    summary.textContent = `${events.length} events`;
  }

  render();

  return client.subscribe(render);
}
```

`subscribe` takes a listener with no arguments and returns a function that removes it. The listener does not receive the data, so `render` calls `getViewModel` to read the current value. The listener runs only when the data changes, which is why `render()` also runs once up front. The text is set with `textContent`, so a step title is never parsed as HTML.

`getViewModel` returns the same object until the snapshot changes, so calling it on every render is cheap.

## 5. Run it

Create `src/main.ts`, or replace the contents of your app's entry file with it, and remove the `enterStep` call you added in step 2 so the counts below start from zero. Two buttons stand in for the wizard, and `mountInspector` renders the data below them.

```ts
// src/main.ts
import { mountInspector } from './inspector';
import { enterStep, failValidation } from './wizard';

const account = { id: 'account', title: 'Account' };

const enter = document.createElement('button');
const fail = document.createElement('button');

enter.textContent = 'Enter account step';
enter.addEventListener('click', () => enterStep(account));
fail.textContent = 'Fail validation';
fail.addEventListener('click', () =>
  failValidation(account, 'Email is required'),
);

document.body.append(enter, fail);
mountInspector(document.body);
```

Start the app in development. Click `Enter account step`, and the list shows `Account, visits: 1` and the count reads `1 events`. Click `Fail validation` and the count reads `2 events`. Each further click on the first button raises the visit count.

The channel notifies subscribers after a microtask, so several writes in the same tick re-render once. A click that records two things still produces one render.

In a production build, the guarded calls in `wizard.ts` are removed. An unguarded inspector keeps working but shows empty data, because its client has `isActive` set to `false` when no channel exists. Guard the call to `mountInspector` with `IS_DEV` if the inspector itself should not ship. [Control devtools in production](./guides/production.md) covers the options.

## The finished result

You wrote five small files:

| File | Role |
| --- | --- |
| `src/devtools.ts` | Describes the data. Imported by the library. |
| `src/wizard.ts` | Reports data at instrumentation points. |
| `src/client.ts` | Derives the view model. |
| `src/inspector.ts` | Renders the view model into the page and keeps it current. |
| `src/main.ts` | Wires the app buttons and mounts the inspector. |

## Next steps

- [Core concepts](./concepts.md) explains the channel, clients and view models you just used.
- [Instrument a library](./guides/instrument-a-library.md) covers ids, validation and removing entities.
- [Derive a view model](./guides/view-models.md) covers reducers in depth.
- [Add typed actions](./guides/actions.md) lets an inspector send commands back to your library.
- For a floating panel in React, see the [React quick start](../../react/v0/quick-start.md).
