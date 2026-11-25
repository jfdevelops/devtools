---
title: Build panel tabs
description: Write custom tabs, use the built-in event log and diagnostics tabs, and embed the tabbed panel inline in your own page.
order: 30
---

A tab is one view in the styled panel. You write tabs for what is specific to your library and use the built-in tabs for the common cases. The same tabs work in `DevtoolsStandalone` and in `DevtoolsPanel`.

In this guide you will:

- Write a custom tab and give it a badge.
- Add the built-in event log and diagnostics tabs.
- Style custom tabs with the panel's helper classes.
- Embed the tabbed panel inline and control the active tab.

## Write a custom tab

A `DevtoolsTab<VM>` is an object with four fields, where `VM` is the view model your client produces.

| Field | Meaning |
| --- | --- |
| `id` | A unique string. Keep it stable. |
| `label` | The text on the tab. |
| `count` | Optional. Returns the number shown next to the label. Return `undefined`, or omit `count`, to hide the badge. |
| `render` | Returns the tab's content from the view model. |

```tsx
// src/steps-tab.tsx
import type { DevtoolsTab } from '@jfdevelops/devtools-kit-react';
import type { WizardViewModel } from './client';

export const stepsTab: DevtoolsTab<WizardViewModel> = {
  id: 'steps',
  label: 'Steps',
  count: (vm) => vm.steps.length,
  render: (vm) => (
    <ul>
      {vm.steps.map((step) => (
        <li key={step.id}>{step.title}</li>
      ))}
    </ul>
  ),
};
```

`render` and `count` are plain functions, not components. The panel calls `count` for every tab on every render, and calls `render` for the active tab only. Neither is a component, so a hook called inside either of them runs as part of `DevtoolsPanel` itself. A hook in `render` changes the number of hooks when the user switches tabs, and a hook in `count` changes it when the `tabs` list changes. Both break React's rules of hooks.

To use hooks or local state, return a component from `render`:

```tsx
// src/filtered-steps-tab.tsx
import { useState } from 'react';
import type { DevtoolsTab } from '@jfdevelops/devtools-kit-react';
import type { WizardViewModel } from './client';

function FilteredSteps({ vm }: { vm: WizardViewModel }) {
  const [query, setQuery] = useState('');
  const steps = vm.steps.filter((step) => step.title.includes(query));

  return (
    <>
      <input value={query} onChange={(event) => setQuery(event.target.value)} />
      <ul>
        {steps.map((step) => (
          <li key={step.id}>{step.title}</li>
        ))}
      </ul>
    </>
  );
}

export const filteredStepsTab: DevtoolsTab<WizardViewModel> = {
  id: 'filtered-steps',
  label: 'Filter steps',
  render: (vm) => <FilteredSteps vm={vm} />,
};
```

Only the active tab is rendered. The panel does not give each tab a `key`, so React keeps the state of a component when two tabs return the same component type at the same position, and resets it when the type differs. Switching to a tab that renders a different component and back resets the state of the one you left. Do not rely on either behavior. Keep state you want to survive in your own component above the panel.

## Add the built-in event log

`createEventLogTab` builds a tab from your events. You tell it how to turn the view model into rows.

```tsx
// src/event-log-tab.tsx
import { createEventLogTab } from '@jfdevelops/devtools-kit-react';
import type { WizardViewModel } from './client';

export const eventsTab = createEventLogTab<WizardViewModel>({
  select: (vm) =>
    vm.events.map((event) => ({
      type: event.type,
      at: event.at,
      detail: event.type === 'validation:fail' ? event.message : event.id,
    })),
});
```

Each row has a `type`, a timestamp `at` in milliseconds, and an optional `detail` string. The tab shows the newest event first and formats the time as local `mm:ss.mmm`. It shows one filter chip for each distinct `type`, in alphabetical order, and clicking a chip hides or shows that type. With no rows it shows `No events.`

The badge counts every row that `select` returns, including rows a filter hides.

By default the tab has the id `events` and the label `Events`. Pass `id` and `label` to change them, which you need if you add two event logs to one panel.

Pass the view model type as a type argument, as above. TypeScript does not infer it when the call is inside a `tabs` array.

## Add the built-in diagnostics tab

`createDiagnosticsTab` lists problems your library found. It works like the event log.

```tsx
// src/problems-tab.tsx
import { createDiagnosticsTab } from '@jfdevelops/devtools-kit-react';
import type { WizardViewModel } from './client';

export const problemsTab = createDiagnosticsTab<WizardViewModel>({
  id: 'problems',
  label: 'Problems',
  select: (vm) =>
    vm.events.flatMap((event) =>
      event.type === 'validation:fail'
        ? [
            {
              kind: 'warning',
              at: event.at,
              title: event.message,
              detail: `Step ${event.id}`,
              context: { stepId: event.id },
            },
          ]
        : [],
    ),
});
```

A row has a `kind`, a time `at`, a `title`, and optionally a `detail` and a `context`. Rows with the kind `error` are drawn in the danger colour, and rows with the kind `warning` or `props:invalid` in the warning colour. Any other `kind` is drawn in the normal text colour. A `context` is shown as formatted JSON, or as a string if it cannot be serialised.

The default id is `diagnostics`, the default label is `Diagnostics`, and an empty list shows `Nothing to report.`

## Style custom tabs

The panel scopes its styles under a `.dtk` element and defines colours as CSS custom properties that switch for `prefers-color-scheme: dark`. Your custom tab content renders inside that element, so you can use its variables and a few helper classes.

```tsx
// src/tree-tab.tsx
import type { DevtoolsTab } from '@jfdevelops/devtools-kit-react';
import type { WizardViewModel } from './client';

export const treeTab: DevtoolsTab<WizardViewModel> = {
  id: 'tree',
  label: 'Tree',
  render: (vm) => (
    <div>
      {vm.steps.map((step) => (
        <div className="dtk__node" key={step.id}>
          <div className="dtk__node-row">
            <span className="dtk__name">{step.id}</span>
            <span className="dtk__tag">{step.visits} visits</span>
          </div>
        </div>
      ))}
    </div>
  ),
};
```

The helper classes are `dtk__node`, `dtk__node-row`, `dtk__node-children`, `dtk__name` and `dtk__tag`. The variables are `--dtk-bg`, `--dtk-bg-subtle`, `--dtk-border`, `--dtk-text`, `--dtk-text-dim`, `--dtk-accent`, `--dtk-danger`, `--dtk-warn`, `--dtk-mono` and `--dtk-sans`. The [React package reference](../plugins/react.md#panel_css) lists them with their default values. To override them in `DevtoolsStandalone`, pass your CSS as `css`. See [Load and theme styles](./standalone-panel.md#load-and-theme-styles).

## Embed the panel inline

`DevtoolsPanel` renders the tab bar and the active tab without any floating chrome. Use it in a routed devtools page or a layout of your own. Give it a parent that has a height, because the panel fills its parent.

Pass the client with the `devtools` prop:

```tsx
// src/inline-panel.tsx
import { DevtoolsPanel } from '@jfdevelops/devtools-kit-react';
import { client } from './client';
import { eventsTab } from './event-log-tab';
import { stepsTab } from './steps-tab';

export function InlinePanel() {
  return (
    <div style={{ height: 320 }}>
      <DevtoolsPanel
        devtools={client}
        tabs={[stepsTab, eventsTab]}
        defaultTabId="events"
      />
    </div>
  );
}
```

Or read the client from a `DevtoolsProvider`, which also accepts an external-store client. See [Inspect an existing store in React](./external-stores.md).

`DevtoolsPanel` opens on the first tab, or on `defaultTabId`. To control the selection yourself, pass `activeTabId` and `onActiveTabChange`.

```tsx
// src/controlled-panel.tsx
import { useState } from 'react';
import { DevtoolsPanel } from '@jfdevelops/devtools-kit-react';
import { client } from './client';
import { eventsTab } from './event-log-tab';
import { stepsTab } from './steps-tab';

export function ControlledPanel() {
  const [activeTabId, setActiveTabId] = useState('steps');

  return (
    <div style={{ height: 320 }}>
      <DevtoolsPanel
        devtools={client}
        tabs={[stepsTab, eventsTab]}
        activeTabId={activeTabId}
        onActiveTabChange={setActiveTabId}
      />
    </div>
  );
}
```

The callback runs when the user selects a tab, not when you change `activeTabId`. The tab bar supports arrow keys, `Home` and `End`, with the selection moving focus.

The panel injects its stylesheet as an inline `<style>` next to its content. Pass `nonce` if your Content Security Policy needs one, or `injectStyles={false}` to load `PANEL_CSS` yourself. [Render in a portal or Shadow DOM](./hosts-and-styles.md) covers both.

## Common mistakes

- Passing different `VM` types to the client and the tabs. TypeScript reports the mismatch as an error on the `devtools` prop.
- Returning `0` from `count` when you want no badge. `0` renders as `0`. Return `undefined` instead.
- Calling hooks directly in `render` or `count`. Return a component from `render` instead.
- Keeping filter or selection state inside a tab and expecting it to survive a tab switch.

## Next steps

- [Add the standalone panel](./standalone-panel.md) puts these tabs in a floating panel.
- [Render in a portal or Shadow DOM](./hosts-and-styles.md) covers styles and hosts.
- [React package reference](../plugins/react.md) lists the tab factories and their options.
