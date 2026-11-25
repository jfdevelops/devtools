---
title: Add the standalone panel
description: Ship a floating devtools panel for your library with DevtoolsStandalone, and configure its placement, visibility and styles.
order: 20
---

`DevtoolsStandalone` is the quickest way to give your library a devtools panel. It renders a floating toggle and a panel inside a Shadow DOM, so your app's styles cannot reach it and its styles cannot leak out. You wrap it once in your devtools package, and your users render that wrapper.

In this guide you will:

- Wrap `DevtoolsStandalone` in a component for your library.
- Control when the panel is open.
- Choose where it mounts.
- Let tabs call actions.
- Theme the panel with your own CSS.
- Understand what the preset does not support.

This guide assumes you have a client and tabs, as built in the [Quick start](../quick-start.md).

## Wrap it in a component for your library

Create the wrapper in your devtools package. It binds your client and your tabs, so your users do not have to.

```tsx
// src/library-devtools.tsx
import {
  DevtoolsStandalone,
  type DevtoolsStandaloneProps,
} from '@jfdevelops/devtools-kit-react';
import { client, type WizardViewModel } from './client';
import { eventsTab, stepsTab } from './tabs';

type LibraryDevtoolsProps = Partial<
  Omit<DevtoolsStandaloneProps<WizardViewModel>, 'devtools' | 'tabs'>
>;

export function LibraryDevtools(props: LibraryDevtoolsProps) {
  return (
    <DevtoolsStandalone
      devtools={client}
      tabs={[stepsTab, eventsTab]}
      title="wizard"
      {...props}
    />
  );
}
```

Spreading `props` last lets the app override anything you set, including `title`. The two required props are `devtools` and `tabs`. The type parameter is the view model, and it must match both the client and every tab.

`title` is the label on the toggle and in the panel header. It defaults to `devtools`.

## Control when the panel is open

By default the panel starts closed. Pass `defaultOpen` to start it open, or control it yourself with `open` and `onOpenChange`.

```tsx
// src/controlled-devtools.tsx
import { useState } from 'react';
import { LibraryDevtools } from './library-devtools';

export function ControlledDevtools() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)}>Open devtools</button>
      <LibraryDevtools open={open} onOpenChange={setOpen} />
    </>
  );
}
```

`onOpenChange` runs when the user toggles, closes or presses Escape. It does not run when you change `open` from your own code.

Opening the panel moves focus into it. When you close it with Escape or the close button, focus returns to the toggle only if the toggle was clicked to open it, or had been clicked earlier. If you open the panel from your own code, as the example above does, focus returns to the element that had focus inside the panel's shadow root before it opened. That element is usually none, so focus is not restored. Move focus yourself in `onOpenChange` if you need it.

## Choose where it mounts

The preset creates a `div[data-devtools-kit]` with an open shadow root and appends it to `document.body`. Pass `container` to append it to another element.

```tsx
// src/mounted-devtools.tsx
import { LibraryDevtools } from './library-devtools';

export function MountedDevtools({ container }: { container: HTMLElement }) {
  return <LibraryDevtools container={container} />;
}
```

The host is created after the component mounts, so the preset renders nothing during server rendering. It is rebuilt if `container`, `injectStyles` or `nonce` change, and removed when the component unmounts.

The toggle is fixed to the bottom right of the viewport. When the panel is open it takes that corner, at most 560 by 440 pixels, and the toggle is hidden. The size and position are not configurable. If you need to place, resize or dock the panel, use the headless primitives in [Build a custom panel](./headless-panel.md) and [Drag, resize and dock a panel](./panel-layout.md).

## Let tabs call actions

Pass an action adapter as `actions` and the preset gives it to the `DevtoolsProvider` it wraps your tabs in. A tab can then call `useDevtoolsActions`, and the actions you describe are available. The contract and adapter are the ones from [Add typed actions](../../../javascript/v0/guides/actions.md).

```ts
// src/wizard-actions.ts
import type { ActionAdapter } from '@jfdevelops/devtools-kit';

export type WizardActions = {
  restart: () => Promise<boolean>;
};

export const wizardActions: ActionAdapter<WizardActions> = {
  restart: {
    execute: async () => {
      const response = await fetch('/api/wizard/restart', { method: 'POST' });

      return response.ok;
    },
  },
};
```

A tab calls the action the same way it does under any provider. See [Call actions from React](./actions.md) for the hook and its errors.

```tsx
// src/restart-tab.tsx
import {
  useDevtoolsActions,
  type DevtoolsTab,
} from '@jfdevelops/devtools-kit-react';
import type { WizardViewModel } from './client';
import type { WizardActions } from './wizard-actions';

function RestartButton() {
  const actions = useDevtoolsActions<WizardActions>();

  return (
    <button
      disabled={!actions.isAvailable('restart')}
      onClick={() => {
        actions.execute('restart').catch((error: unknown) => {
          console.error('Restart failed', error);
        });
      }}
    >
      Restart wizard
    </button>
  );
}

export const restartTab: DevtoolsTab<WizardViewModel> = {
  id: 'restart',
  label: 'Restart',
  render: () => <RestartButton />,
};
```

```tsx
// src/actions-devtools.tsx
import { DevtoolsStandalone } from '@jfdevelops/devtools-kit-react';
import { client } from './client';
import { restartTab } from './restart-tab';
import { wizardActions } from './wizard-actions';

export function ActionsDevtools() {
  return (
    <DevtoolsStandalone
      devtools={client}
      tabs={[restartTab]}
      actions={wizardActions}
      title="wizard"
    />
  );
}
```

TypeScript infers the contract from `actions`, but the hook only asserts the one you give it, so a wrong contract in `useDevtoolsActions` still compiles. Define the adapter once at module scope. The provider remembers its action client by the identity of the `actions` object, so an object literal written in JSX is replaced on every render. Without `actions`, every action is unavailable.

If you pass `actions` inside a wrapper that spreads app-provided props last, as `LibraryDevtools` does, add `'actions'` to its `Omit` when the app should not replace your adapter.

## Load and theme styles

By default the preset adds one `<style>` element to its shadow root, containing `CHROME_CSS` for the toggle and header and `PANEL_CSS` for the tabs.

| You need | Do this |
| --- | --- |
| A Content Security Policy that requires a nonce | Pass `nonce`. It is applied to the built-in `<style>` and to the one for `css`. |
| To change colours, fonts or other styles | Pass your CSS as `css`. Override `--dtk-*` on `.dtk` for the tabs, and the `.dtk-chrome__*` classes for the toggle, header and frame. |
| To replace the built-in styles | Pass `injectStyles={false}` and supply every rule you need in `css`. `CHROME_CSS` and `PANEL_CSS` are exported if you want to start from them. |
| To load a stylesheet file into the shadow root | Do not use `DevtoolsStandalone`. Build the panel with `DevtoolsShadowHost` and `DevtoolsPanel`, or with the headless primitives. See [Render in a portal or Shadow DOM](./hosts-and-styles.md). |

`css` is a string of CSS. The preset adds it to the shadow root in its own `<style>`, after the built-in styles, whether or not `injectStyles` is on. A rule with the same specificity as a built-in rule therefore wins.

The styles come in two parts. The tabs inside the panel use the `--dtk-*` variables defined on `.dtk`, so override those there. The toggle, the header and the panel frame come from `CHROME_CSS`, which sets their colours directly on `.dtk-chrome__toggle`, `.dtk-chrome__header` and `.dtk-chrome__panel` and does not use the variables. Override those classes to recolour them.

```tsx
// src/themed-devtools.tsx
import { LibraryDevtools } from './library-devtools';

const css = `
.dtk { --dtk-accent: #0a7d5a; }
.dtk-chrome__toggle,
.dtk-chrome__header { background: #0a7d5a; }

@media (prefers-color-scheme: dark) {
  .dtk { --dtk-accent: #5ad1a4; }
}
`;

export function ThemedDevtools() {
  return <LibraryDevtools css={css} />;
}
```

The built-in dark values are set on `.dtk` inside a `prefers-color-scheme` media query, so an override that should differ in dark mode needs its own media query, as here. The chrome classes have no dark values of their own. The [React package reference](../plugins/react.md#panel_css) lists every variable.

Changing `css` replaces that `<style>` without recreating the host. Removing it, or passing an empty string, removes the element. A stylesheet in your page's `<head>` never applies inside the shadow root, so `css` is the way to reach it.

## Turn it off or on in production

`DevtoolsStandalone` renders `null` in a production build, unless you pass `enabled`. `enabled` defaults to "this is not a production build", and `enabled={true}` renders it everywhere. See [Control the panel in production](./production.md).

## What the preset does not support

`DevtoolsStandalone` is deliberately narrow. These limits remain.

- **Channel clients only.** The `devtools` prop is typed as the `Devtools` class, which is what `createClient` returns. An external-store client from `createExternalStoreClient` is a type error here. Render it with `DevtoolsPanel` inside a `DevtoolsProvider`, or with the headless primitives.
- **No drag, resize or dock.** The toggle and panel sit in a fixed corner, and their size is not configurable. Use the headless primitives for a movable panel.

## Common mistakes

- Creating the client inside the wrapper component. Create it once at module scope.
- Passing tabs typed for a different view model than the client's. TypeScript reports the mismatch as an error on the `devtools` prop.
- Expecting the panel in a production build without `enabled`.
- Passing a new `actions` object on every render. Create the adapter once.
- Expecting a stylesheet in the page to style the panel. Pass the CSS as `css`.

## Next steps

- [Build panel tabs](./tabs.md) covers the tabs you pass in.
- [Render in a portal or Shadow DOM](./hosts-and-styles.md) covers styling and placement in depth.
- [`DevtoolsStandalone` reference](../plugins/react.md#devtoolsstandalone) lists every prop.
