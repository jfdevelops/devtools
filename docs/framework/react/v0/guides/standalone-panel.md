---
title: Add the standalone panel
description: Ship a floating devtools panel for your library with DevtoolsStandalone, and configure its placement, visibility and styles.
order: 20
---

`DevtoolsStandalone` is the quickest way to give your library a devtools panel. It renders a floating toggle and a panel inside a Shadow DOM, so your app's styles cannot reach it and its styles cannot leak out. You wrap it once in your devtools package, and your users render that wrapper.

In this guide you will:

- Wrap `DevtoolsStandalone` in a component for your library.
- Control when the panel is open.
- Choose where it mounts and how its styles load.
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

## Load styles

By default the preset adds one `<style>` element to its shadow root, containing `CHROME_CSS` for the toggle and header and `PANEL_CSS` for the tabs.

| You need | Do this |
| --- | --- |
| A Content Security Policy that requires a nonce | Pass `nonce`. It is applied to the injected `<style>`. |
| To load or theme the stylesheet yourself | Do not use `DevtoolsStandalone`. Build the panel with `DevtoolsShadowHost` and `DevtoolsPanel`, or with the headless primitives. See [Render in a portal or Shadow DOM](./hosts-and-styles.md). |

The preset does not expose its shadow root, so there is no supported way to load your own stylesheet into it. With `injectStyles={false}` it adds no styles at all and the panel is unstyled. The host is an open shadow root, so `document.querySelector('[data-devtools-kit]')?.shadowRoot` reaches it after mount, and a `<style>` appended there applies. That is fragile: the host is created in an effect, and it is replaced, with your style lost, whenever `container`, `injectStyles` or `nonce` change. A stylesheet in your page's `<head>` never applies inside the shadow root. Any override of the panel's colour variables has to target `.dtk`, because that element defines them.

## Turn it off or on in production

`DevtoolsStandalone` renders `null` in a production build, unless you pass `enabled`. `enabled` defaults to "this is not a production build", and `enabled={true}` renders it everywhere. See [Control the panel in production](./production.md).

## What the preset does not support

`DevtoolsStandalone` is deliberately narrow.

- **No `actions` prop.** The preset wraps its content in its own `DevtoolsProvider` with no action adapter. A custom tab that calls `useDevtoolsActions` does not throw, but gets an action client where every action is unavailable, so `isAvailable` returns `false` and `execute` rejects with `UnavailableActionError`. To use actions, build the panel with the headless primitives. See [Call actions from React](./actions.md).
- **Channel clients only.** The `devtools` prop is typed as the `Devtools` class, which is what `createClient` returns. An external-store client from `createExternalStoreClient` is a type error here. Render it with `DevtoolsPanel` inside a `DevtoolsProvider`, or with the headless primitives.
- **No drag, resize or dock.**

## Common mistakes

- Creating the client inside the wrapper component. Create it once at module scope.
- Passing tabs typed for a different view model than the client's. TypeScript reports the mismatch as an error on the `devtools` prop.
- Expecting the panel in a production build without `enabled`.

## Next steps

- [Build panel tabs](./tabs.md) covers the tabs you pass in.
- [Render in a portal or Shadow DOM](./hosts-and-styles.md) covers styling and placement in depth.
- [`DevtoolsStandalone` reference](../plugins/react.md#devtoolsstandalone) lists every prop.
