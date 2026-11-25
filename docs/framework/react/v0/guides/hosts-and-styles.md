---
title: Render in a portal or Shadow DOM
description: Choose where devtools render, isolate them in a Shadow DOM, and load or theme their styles under a strict content security policy.
order: 80
---

The kit never decides where your devtools appear. You pick a host: inline in your page, a portal into a container you own, or a Shadow DOM. This guide covers each host and how styles reach it.

In this guide you will:

- Render a panel into a container with a portal.
- Isolate a panel in a Shadow DOM and load its styles there.
- Supply styles yourself when you have a content security policy.
- Understand what renders during server rendering.

## Render inline

The simplest host is no host. Render the panel or your own components where they belong in the tree, and the kit adds no wrapper around them.

## Render into a container with a portal

`DevtoolsPortal` renders its children into an element you choose. It takes a `container` that is an `Element`, a `DocumentFragment` or `null`. When `container` is `null` it renders nothing.

```tsx
// src/portal-panel.tsx
import {
  DevtoolsPanel,
  DevtoolsPortal,
} from '@jfdevelops/devtools-kit-react';
import { client } from './client';
import { eventsTab, stepsTab } from './tabs';

export function PortalPanel({ container }: { container: HTMLElement | null }) {
  return (
    <DevtoolsPortal container={container}>
      <div style={{ height: 320 }}>
        <DevtoolsPanel devtools={client} tabs={[stepsTab, eventsTab]} />
      </div>
    </DevtoolsPortal>
  );
}
```

The container might be another devtools host's element. Because the container is explicit, you can render your inspector inside another library's devtools.

A portal does not isolate styles. The panel still injects its stylesheet inline, next to its content, in whatever document the container is part of.

## Isolate a panel in a Shadow DOM

`DevtoolsShadowHost` creates a child element in a container, attaches an open shadow root to it, and renders its children inside that root. The `css` prop adds a `<style>` to the root, and `nonce` goes on that style element.

```tsx
// src/shadow-panel.tsx
import { useState } from 'react';
import {
  DevtoolsPanel,
  DevtoolsProvider,
  DevtoolsShadowHost,
  PANEL_CSS,
} from '@jfdevelops/devtools-kit-react';
import { client } from './client';
import { eventsTab, stepsTab } from './tabs';

const css = `
:host { display: block; height: 100%; }
${PANEL_CSS}
.dtk { --dtk-accent: #0a7d5a; }
`;

export function ShadowPanel({ cspNonce }: { cspNonce?: string }) {
  const [container, setContainer] = useState<HTMLElement | null>(null);

  return (
    <DevtoolsProvider client={client}>
      <div ref={setContainer} style={{ height: 320 }} />
      <DevtoolsShadowHost container={container} css={css} nonce={cspNonce}>
        <DevtoolsPanel tabs={[stepsTab, eventsTab]} injectStyles={false} />
      </DevtoolsShadowHost>
    </DevtoolsProvider>
  );
}
```

A few things to note in this example:

- The container is held in state so the host mounts after the element exists. The host renders nothing while `container` is `null`.
- `injectStyles={false}` stops the panel adding its own `<style>`, because the host already supplies `css`.
- The extra rule at the end of `css` changes one colour variable. The panel defines its variables on `.dtk`, so a later rule on `.dtk` overrides them.
- `:host` sizes the host element, because the panel fills its parent.

React context crosses portals and shadow roots, so the provider can sit outside the host. The host element is created in an effect after mount, appended to the container, and removed when the component unmounts or `container` changes.

## Mount the standalone preset elsewhere

`DevtoolsStandalone` makes its own shadow host. By default it appends to `document.body`, and you can pass `container` to choose another element. See [Add the standalone panel](./standalone-panel.md).

## Where styles come from

| What you render | Styles |
| --- | --- |
| Headless primitives and hosts | None. You write them. |
| `DevtoolsPanel` | An inline `<style>` containing `PANEL_CSS`, unless `injectStyles={false}`. |
| `DevtoolsStandalone` | One `<style>` in its shadow root containing `CHROME_CSS` and `PANEL_CSS`, unless `injectStyles={false}`. |
| `DevtoolsShadowHost` | A `<style>` containing your `css`, only when you pass `css`. |

The kit exports `PANEL_CSS` and `CHROME_CSS` as strings so you can place them yourself. The [React package reference](../plugins/react.md#panel_css) lists the custom properties and helper classes.

## Use a content security policy

A policy that restricts inline styles needs a nonce. Every place the kit writes a `<style>` accepts a `nonce`: `DevtoolsPanel`, `DevtoolsStandalone` and `DevtoolsShadowHost`. Pass the nonce your server issued for the page.

If you would rather not allow inline styles at all, pass `injectStyles={false}` and load `PANEL_CSS` yourself through a stylesheet your policy allows. For anything in a shadow root the stylesheet must be loaded into that root, and a stylesheet in your page's `<head>` does not reach inside it. With `DevtoolsShadowHost` you do that through its `css` prop. `DevtoolsStandalone` exposes no way to do it, so use `DevtoolsShadowHost` with `DevtoolsPanel` when you need to supply the styles. The limits of the preset are in [Add the standalone panel](./standalone-panel.md#what-the-preset-does-not-support).

## Server rendering

The hosts render nothing on the server. `DevtoolsShadowHost` creates its element in an effect, and `DevtoolsPortal` renders nothing for a `null` container, which is what a container held in state is until the first client render. `DevtoolsStandalone` also creates its host in an effect, so it renders nothing on the server either.

Headless content such as `DevtoolsPanelContent` does render on the server, if the panel is open. The hooks use the client's server view model there. See [Inspect an existing store in React](./external-stores.md).

## Next steps

- [Add the standalone panel](./standalone-panel.md) shows the preset's own `container`, `nonce` and `injectStyles` props.
- [Build panel tabs](./tabs.md) covers the panel's helper classes.
- [React headless reference](../plugins/react-headless.md#devtoolsportal) lists the host props.
