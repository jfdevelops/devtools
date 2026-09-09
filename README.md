# devtools-kit

Reusable building blocks for library devtools: a dev-only event/registry channel,
a memoised client, and a React panel shell (provider, hooks, tab plugins, and a
standalone Shadow-DOM chrome). A library supplies its own entity/event schema, a
view-model reducer, and any custom tabs — the kit provides everything else, and
compiles to nothing in production.

| Path | Description |
| --- | --- |
| `packages/devtools-kit` | `@jfdevelops/devtools-kit` — framework-agnostic channel + client |
| `packages/devtools-kit-react` | `@jfdevelops/devtools-kit-react` — React provider, hooks, panel, standalone chrome |

## How it fits together

1. **Your library** describes its data with any
   [Standard Schema](https://standardschema.dev) library (Zod, Valibot,
   ArkType, …) and calls the API at instrumentation points. Types are inferred
   from the schemas — no generics:

   ```ts
   // my-lib/src/devtools.ts
   import { z } from 'zod';
   import { createDevtools } from '@jfdevelops/devtools-kit';

   export const devtools = createDevtools({
     key: '__MY_LIB_DEVTOOLS__',
     entities: {
       step: z.object({ id: z.string(), title: z.string() }),
       field: z.object({ name: z.string(), valid: z.boolean() }),
     },
     events: z.discriminatedUnion('type', [
       z.object({ type: z.literal('step:enter'), at: z.number(), id: z.string() }),
       z.object({ type: z.literal('validation:fail'), at: z.number(), message: z.string() }),
     ]),
   });

   // …elsewhere, guarded so it strips in prod:
   devtools.putEntity('step', step.id, step);
   devtools.emit({ type: 'step:enter', at: Date.now(), id: step.id });
   ```

2. **Your `-devtools` package** turns snapshots into a view model and tabs:

   ```tsx
   import { devtools } from 'my-lib/devtools';
   import {
     createEventLogTab,
     createDiagnosticsTab,
     DevtoolsStandalone,
     type DevtoolsTab,
   } from '@jfdevelops/devtools-kit-react';

   const client = devtools.createClient((s) => ({
     steps: s.entities.step ?? [],
     events: s.events,
   }));

   const stepsTab: DevtoolsTab<VM> = {
     id: 'steps', label: 'Steps',
     count: (vm) => vm.steps.length,
     render: (vm) => <StepList steps={vm.steps} />,
   };

   export const MyLibDevtools = (props) => (
     <DevtoolsStandalone
       devtools={client}
       tabs={[
         stepsTab,
         createEventLogTab({ select: (vm) => vm.events.map(toRow) }),
         createDiagnosticsTab({ select: (vm) => vm.events.filter(isError).map(toDiag) }),
       ]}
       {...props}
     />
   );
   ```

3. **Your app** drops `<MyLibDevtools />` in during development. Nothing ships in
   production — the channel is absent, the components render `null`, and every
   guarded `emit` call folds away.

## Development

**Requirements:** Node `^20.19.0 \|\| >=22.12.0`, pnpm `10.28.1`, React `>=18` (peer of the React package)

```bash
pnpm install
pnpm build
pnpm test
pnpm typecheck
```

## Publishing

Changesets drives versioning. Add one with `pnpm changeset`; merging to `main`
opens/updates a release PR, and merging that publishes to npm (needs an
`NPM_TOKEN` secret).
