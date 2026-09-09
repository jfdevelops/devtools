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

1. **Your library** creates a channel API once and calls it at instrumentation
   points (a component mounted, a step advanced, an error thrown):

   ```ts
   // my-lib/src/devtools.ts
   import { createDevtoolsChannelApi } from '@jfdevelops/devtools-kit';

   type Entities = { step: StepDescriptor; field: FieldDescriptor };
   type Event =
     | { type: 'step:enter'; at: number; id: string }
     | { type: 'validation:fail'; at: number; message: string };

   export const devtools = createDevtoolsChannelApi<Entities, Event>(
     '__MY_LIB_DEVTOOLS__',
   );

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
