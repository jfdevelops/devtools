---
title: Quick start
description: Add a floating devtools panel to a small wizard library, with a steps tab and an event log, in six steps.
order: 30
---

In this tutorial you build devtools for a small library that walks users through a wizard. At the end, a floating button in your app opens a panel that lists the wizard's steps and logs every step entry and validation failure.

The tutorial uses one project and three roles in it: a wizard library that records data, a devtools module that renders it, and an app. In a real project the library and its devtools usually live in separate packages. [Core concepts](../../javascript/v0/concepts.md) explains the split. Not using React? Follow the [JavaScript quick start](../../javascript/v0/quick-start.md).

## Prerequisites

- A React 18 or later app with a bundler that replaces `process.env.NODE_ENV`. See [Installation](./installation.md).
- The packages from [Installation](./installation.md): `@jfdevelops/devtools-kit`, `@jfdevelops/devtools-kit-react` and `zod`.

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

The devtools side reads the data through a client. Create `src/client.ts`. The function you pass to `createClient` is a reducer: it receives the raw snapshot and returns whatever shape your UI wants.

```ts
// src/client.ts
import { devtools } from './devtools';

export const client = devtools.createClient((snapshot) => ({
  steps: snapshot.entities.step,
  events: snapshot.events,
}));

export type WizardViewModel = ReturnType<typeof client.getViewModel>;
```

Create the client once, at module scope, as here. A client created inside a component is a new object on every render. `snapshot.entities.step` is always an array, even before the first `putEntity`, so the reducer needs no fallback.

## 4. Define the tabs

Create `src/tabs.tsx`. A tab has an `id`, a `label`, an optional `count` for the badge, and a `render` function that receives the view model. The kit ships an event log tab, so you only write the steps tab.

```tsx
// src/tabs.tsx
import { createEventLogTab, type DevtoolsTab } from '@jfdevelops/devtools-kit-react';
import type { WizardViewModel } from './client';

export const stepsTab: DevtoolsTab<WizardViewModel> = {
  id: 'steps',
  label: 'Steps',
  count: (vm) => vm.steps.length,
  render: (vm) => (
    <ul>
      {vm.steps.map((step) => (
        <li key={step.id}>
          {step.title}, visits: {step.visits}
        </li>
      ))}
    </ul>
  ),
};

export const eventsTab = createEventLogTab<WizardViewModel>({
  select: (vm) =>
    vm.events.map((event) => ({
      type: event.type,
      at: event.at,
      detail: event.type === 'validation:fail' ? event.message : event.id,
    })),
});
```

`createEventLogTab` takes a `select` function that maps your events to rows with a `type`, a time `at` and an optional `detail`. Pass the view model type to it, as here. TypeScript cannot infer it from a `tabs` array later.

## 5. Wrap the panel in a component

Create `src/wizard-devtools.tsx`. `DevtoolsStandalone` draws a floating toggle and a panel inside a Shadow DOM, so your app's styles do not touch it.

```tsx
// src/wizard-devtools.tsx
import { DevtoolsStandalone } from '@jfdevelops/devtools-kit-react';
import { client } from './client';
import { eventsTab, stepsTab } from './tabs';

export function WizardDevtools() {
  return (
    <DevtoolsStandalone
      devtools={client}
      tabs={[stepsTab, eventsTab]}
      title="wizard"
    />
  );
}
```

## 6. Render it in the app

Add the component anywhere in your app. Here a button stands in for the wizard.

```tsx
// src/App.tsx
import { enterStep, failValidation } from './wizard';
import { WizardDevtools } from './wizard-devtools';

const account = { id: 'account', title: 'Account' };

export function App() {
  return (
    <>
      <button onClick={() => enterStep(account)}>Enter account step</button>
      <button onClick={() => failValidation(account, 'Email is required')}>
        Fail validation
      </button>
      <WizardDevtools />
    </>
  );
}
```

Start the app in development. A pill labelled `wizard` appears at the bottom right of the page. Click it to open the panel. Click the app's buttons and watch the `Steps` tab badge and the event log update. Press Escape to close the panel. Focus returns to the pill.

In a production build the pill does not render, and the guarded calls in `wizard.ts` are removed from the bundle.

## The finished result

You wrote six small files:

| File | Role |
| --- | --- |
| `src/devtools.ts` | Describes the data. Imported by the library. |
| `src/wizard.ts` | Reports data at instrumentation points. |
| `src/client.ts` | Derives the view model. |
| `src/tabs.tsx` | Defines what the panel shows. |
| `src/wizard-devtools.tsx` | Renders the floating panel. |
| `src/App.tsx` | Renders it in the app. |

## Next steps

- [Core concepts](../../javascript/v0/concepts.md) explains the channel, clients and view models you just used, and [React concepts](./concepts.md) covers the provider and the presets.
- [Instrument a library](../../javascript/v0/guides/instrument-a-library.md) covers ids, validation and removing entities.
- [Derive a view model](../../javascript/v0/guides/view-models.md) covers reducers in depth.
- [Build panel tabs](./guides/tabs.md) covers the built-in tabs and inline panels.
- [Add the standalone panel](./guides/standalone-panel.md) covers its options and limits.
