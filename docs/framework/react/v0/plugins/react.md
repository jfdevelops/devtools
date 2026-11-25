---
title: React package reference
description: Exact props, options and behavior of the styled presets and tab helpers exported from the root of the React package.
order: 10
---

This page documents the exports that only the root entry of `@jfdevelops/devtools-kit-react` provides: the styled presets, the tab types and the style strings. The provider, hooks, headless primitives and hosts are documented in the [React headless reference](./react-headless.md). The framework-agnostic core is documented in the [core API reference](../reference/index.md). Guides for the core are in the [JavaScript docs](../../../javascript/v0/overview.md).

The package has two entry points:

| Entry point | Contains |
| --- | --- |
| `@jfdevelops/devtools-kit-react` | Everything on this page, everything in the headless reference, and 20 core exports. |
| `@jfdevelops/devtools-kit-react/headless` | Everything in the headless reference and the whole core API. No presets, no CSS. |

Peer dependencies are `react` and `react-dom`, both version 18 or later.

## Core exports missing from the root entry

The root entry re-exports these 20 core exports: `createDevtools`, `Devtools`, `getDevtoolsChannel`, `IS_DEV`, `createExternalStoreClient`, `createActionClient`, `UnavailableActionError` and the types `CreateClientOptions`, `CreateDevtoolsOptions`, `DevtoolsApi`, `DevtoolsChannel`, `DevtoolsChannelSnapshot`, `DevtoolsOptions`, `DevtoolsSnapshotOf`, `EntitySchemas`, `StandardSchemaV1`, `DevtoolsClient`, `ExternalStore`, `ActionAdapter` and `ActionContract`.

It does not re-export `createPreferenceStore`, `PreferenceStorage` or `DEVTOOLS_CHANNEL_VERSION`. Import those from `@jfdevelops/devtools-kit` or from `@jfdevelops/devtools-kit-react/headless`.

## DevtoolsStandalone

A floating toggle and a panel, rendered in a Shadow DOM. See [Add the standalone panel](../guides/standalone-panel.md) for a walkthrough.

```ts
import { DevtoolsStandalone } from '@jfdevelops/devtools-kit-react';
```

```ts
function DevtoolsStandalone<VM>(
  props: DevtoolsStandaloneProps<VM>,
): JSX.Element | null;
```

### DevtoolsStandaloneProps

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `devtools` | `Devtools<VM>` | Required | The client to read from. It must be a `Devtools` instance, which is what `createClient` returns. |
| `tabs` | `ReadonlyArray<DevtoolsTab<VM>>` | Required | The tabs to show, in order. |
| `defaultOpen` | `boolean` | `false` | Whether the panel starts open. |
| `title` | `string` | `'devtools'` | The label on the toggle and in the panel header. |
| `enabled` | `boolean` | `true` unless `process.env.NODE_ENV` is `'production'` | Whether to render. |
| `nonce` | `string` | None | A nonce for the injected `<style>` element. |
| `injectStyles` | `boolean` | `true` | Whether to inject `CHROME_CSS` and `PANEL_CSS` into the shadow root. |
| `container` | `HTMLElement` | `document.body` | The element the host is appended to. |
| `open` | `boolean` | None | Controls visibility. The panel is uncontrolled while it is `undefined`. |
| `onOpenChange` | `(open: boolean) => void` | None | Called when the user opens or closes the panel. |

### Behavior

- Returns `null` unless `enabled`. The default is computed once, when the module loads.
- Creates a `div[data-devtools-kit]` with an open shadow root in an effect after mounting, so it renders nothing during server rendering. The host is removed on unmount and recreated when `container`, `injectStyles` or `nonce` change.
- Adds one `<style>` containing `CHROME_CSS` and then `PANEL_CSS` to the shadow root, unless `injectStyles` is `false`. With `injectStyles` set to `false` the shadow root has no styles.
- Wraps its content in its own `DevtoolsProvider` with `devtools`, and no actions. Components inside it that call `useDevtoolsActions` get an action client where every action is unavailable.
- The toggle is a `DevtoolsTrigger`. It stays mounted and is `hidden` while the panel is open. The panel is a `DevtoolsPanelContent` with `autoFocus`, a header with the title and a `DevtoolsClose` button labelled `Close devtools`, and a `DevtoolsPanel` with `injectStyles` off.
- Opening moves focus into the panel. On close, focus returns to the toggle only if the toggle was clicked to open the panel (or had been clicked before). When the panel is opened from your own code, focus returns to the element that had focus inside the shadow root before it opened, which is usually none.
- `onOpenChange` runs only for user interactions.

### Limitations

It has no `actions` prop, accepts only a `Devtools` instance, and cannot be dragged, resized or docked. See [What the preset does not support](../guides/standalone-panel.md#what-the-preset-does-not-support).

### Example

```tsx
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

Related: [`DevtoolsPanel`](#devtoolspanel), [`DevtoolsTab`](#devtoolstab), [Control the panel in production](../guides/production.md).

## DevtoolsPanel

A tab bar over a list of tabs, with no floating chrome. See [Build panel tabs](../guides/tabs.md) for a walkthrough.

```ts
import { DevtoolsPanel } from '@jfdevelops/devtools-kit-react';
```

```ts
function DevtoolsPanel<VM>(props: DevtoolsPanelProps<VM>): JSX.Element;
```

### DevtoolsPanelProps

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `tabs` | `ReadonlyArray<DevtoolsTab<VM>>` | Required | The tabs to show, in order. |
| `devtools` | `Devtools<VM>` | The nearest provider's client | Read the view model from this instance instead of the provider. |
| `defaultTabId` | `string` | The first tab | The id of the tab shown first. |
| `activeTabId` | `string` | None | Controls the selected tab. |
| `onActiveTabChange` | `(id: string) => void` | None | Called when the user selects a tab. |
| `injectStyles` | `boolean` | `true` | Whether to render an inline `<style>` containing `PANEL_CSS`. |
| `nonce` | `string` | None | A nonce for that `<style>` element. |

### Behavior

- Renders a root element with the class `dtk` that fills its parent, a `role="tablist"` tab bar, and the body of the active tab. Only the active tab renders. `count` is called for every tab, and `render` for the active tab, as plain functions, so use a component inside `render` if you need hooks. The panel sets no `key` on the tab body, so whether a tab's state resets on a switch depends on whether the new tab renders the same component type.
- Tab selection uses `useDevtoolsTabs`: left and right arrows, `Home` and `End`, and focus follows selection. An id that matches no tab falls back to the first tab.
- Each tab label shows its `count`, when `count` returns a number, after a space.
- Reads the view model with `useDevtoolsViewModel`. With no `devtools` prop and no provider it throws `` `useDevtoolsViewModel` needs a `<DevtoolsProvider>` ancestor or an explicit instance. ``
- Has no production gate.

### Limitations

- The `devtools` prop is typed as the `Devtools` class. To use an external-store client, render the panel inside a `DevtoolsProvider` and omit `devtools`.
- When it reads from a provider, the type of the tabs' view model is not checked against the provider's client.

Related: [`DevtoolsStandalone`](#devtoolsstandalone), [`DevtoolsTab`](#devtoolstab).

## DevtoolsTab

The shape of one tab.

```ts
import type { DevtoolsTab } from '@jfdevelops/devtools-kit-react';
```

```ts
interface DevtoolsTab<VM> {
  id: string;
  label: string;
  count?: (viewModel: VM) => number | undefined;
  render: (viewModel: VM) => ReactNode;
}
```

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | `string` | Yes | A stable, unique id. |
| `label` | `string` | Yes | The text on the tab. |
| `count` | `(viewModel: VM) => number \| undefined` | No | The number shown next to the label. Returning `undefined` hides it. |
| `render` | `(viewModel: VM) => ReactNode` | Yes | The tab's content. |

## createEventLogTab

Builds a tab that lists events, newest first, with a filter chip for each event type.

```ts
import { createEventLogTab } from '@jfdevelops/devtools-kit-react';
```

```ts
function createEventLogTab<VM>(options: EventLogTabOptions<VM>): DevtoolsTab<VM>;
```

### EventLogTabOptions

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `select` | `(viewModel: VM) => ReadonlyArray<DevtoolsEventRow>` | Required | Maps the view model to rows, oldest first. |
| `id` | `string` | `'events'` | The tab id. |
| `label` | `string` | `'Events'` | The tab label. |

### DevtoolsEventRow

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `type` | `string` | Yes | The event type, used for the filter chips. |
| `at` | `number` | Yes | A timestamp in milliseconds since the epoch, shown as local `mm:ss.mmm`. |
| `detail` | `string` | No | Text shown after the type. |

### Behavior

- Rows are shown newest first. The tab shows one chip for each distinct `type`, sorted by name, and clicking a chip toggles whether that type is shown.
- The badge is `select(viewModel).length`, so it counts rows hidden by a filter.
- With no visible rows it shows `No events.`
- Pass the view model type as a type argument. It is not inferred from the surrounding array.

## createDiagnosticsTab

Builds a tab that lists problems, newest first.

```ts
import { createDiagnosticsTab } from '@jfdevelops/devtools-kit-react';
```

```ts
function createDiagnosticsTab<VM>(
  options: DiagnosticsTabOptions<VM>,
): DevtoolsTab<VM>;
```

### DiagnosticsTabOptions

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `select` | `(viewModel: VM) => ReadonlyArray<DevtoolsDiagnosticRow>` | Required | Maps the view model to rows, oldest first. |
| `id` | `string` | `'diagnostics'` | The tab id. |
| `label` | `string` | `'Diagnostics'` | The tab label. |

### DevtoolsDiagnosticRow

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `kind` | `string` | Yes | The category. Set as the `data-kind` attribute. |
| `at` | `number` | Yes | A timestamp in milliseconds. |
| `title` | `string` | Yes | The headline. |
| `detail` | `string` | No | Text under the title, shown when not empty. |
| `context` | `unknown` | No | Shown as formatted JSON, or as a string if serialising fails. Not shown when `null` or `undefined`. |

### Behavior

- Rows are shown newest first, and the badge is `select(viewModel).length`.
- `PANEL_CSS` colours the title of rows whose `kind` is `error` and of rows whose `kind` is `warning` or `props:invalid`. Other kinds use the normal text colour.
- With no rows it shows `Nothing to report.`

## PANEL_CSS

The scoped stylesheet for the panel, as a string.

```ts
import { PANEL_CSS } from '@jfdevelops/devtools-kit-react';
```

```ts
const PANEL_CSS: string;
```

Every rule is scoped under `.dtk`. The `.dtk` element resets inherited styles with `all: initial` and defines these custom properties. In a dark colour scheme (`prefers-color-scheme: dark`) the colours change as shown.

| Property | Light | Dark |
| --- | --- | --- |
| `--dtk-bg` | `#ffffff` | `#1b1b1f` |
| `--dtk-bg-subtle` | `#f6f6f7` | `#26262b` |
| `--dtk-border` | `#e2e2e5` | `#37373d` |
| `--dtk-text` | `#1b1b1f` | `#ececef` |
| `--dtk-text-dim` | `#6a6a73` | `#9a9aa3` |
| `--dtk-accent` | `#6d40c4` | `#b794f6` |
| `--dtk-danger` | `#c4364a` | `#f2809a` |
| `--dtk-warn` | `#a9700a` | `#e0b464` |
| `--dtk-mono` | A monospace font stack | Same |
| `--dtk-sans` | A system sans-serif font stack | Same |

Helper classes for custom tabs:

| Class | Use |
| --- | --- |
| `dtk__node` | A tree node, with a small vertical margin. |
| `dtk__node-row` | A node's row, laid out horizontally. |
| `dtk__node-children` | A node's children, indented with a left border. |
| `dtk__name` | A monospace name. |
| `dtk__tag` | A small uppercase label. |

The stylesheet also contains classes the built-in tabs use, such as `dtk__tab`, `dtk__row` and `dtk__diag`. Treat those as internal.

## CHROME_CSS

The stylesheet for the standalone preset's toggle and header, as a string.

```ts
import { CHROME_CSS } from '@jfdevelops/devtools-kit-react';
```

```ts
const CHROME_CSS: string;
```

It defines `:host`, `.dtk-chrome`, `.dtk-chrome__toggle`, `.dtk-chrome__panel`, `.dtk-chrome__header`, `.dtk-chrome__close` and `.dtk-chrome__slot`. The chrome is fixed 12 pixels from the bottom right of the viewport with `z-index: 2147483000`, and the open panel is at most 560 pixels wide and 440 pixels high. `DevtoolsStandalone` exposes no way to load it into its shadow root yourself. To supply your own styles, use `DevtoolsShadowHost` with `DevtoolsPanel`.
