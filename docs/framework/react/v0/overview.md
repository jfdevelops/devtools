---
title: Overview
description: What the React package adds to Devtools Kit, its two entry points, the two ways to render, and which page to read first.
order: 10
---

`@jfdevelops/devtools-kit-react` renders devtools for data recorded with `@jfdevelops/devtools-kit`. The core package is documented in the [JavaScript docs](../../javascript/v0/overview.md).

The React package gives you a provider and hooks that read a client, a set of headless primitives for building a panel, and two styled presets. You decide what the panel shows and where it renders.

## Where React fits

The kit assumes three pieces of code, described in full under [Three roles](../../javascript/v0/overview.md#three-roles).

- The instrumented library records data with `@jfdevelops/devtools-kit` and never imports React.
- The devtools package turns that data into a view model and renders it. This is where you use `@jfdevelops/devtools-kit-react`.
- The app renders the devtools component during development.

## Two entry points

`@jfdevelops/devtools-kit-react` adds React on top of the core, through two entry points:

| Entry point | Contains | Use it when |
| --- | --- | --- |
| `@jfdevelops/devtools-kit-react` | The provider and hooks, the headless primitives, the styled presets (`DevtoolsStandalone` and `DevtoolsPanel`), and the whole core API re-exported. | You want a working floating panel quickly, or an inline tabbed panel. |
| `@jfdevelops/devtools-kit-react/headless` | The provider and hooks, the headless primitives and the portal and Shadow DOM hosts, plus the whole core API. No presets and no CSS. | You are composing your own panel, or rendering inside another devtools host. |

## Two ways to get data in

You can record data into the kit's channel with [Instrument a library](../../javascript/v0/guides/instrument-a-library.md), or wrap a store you already have with [Connect an existing store](../../javascript/v0/guides/external-stores.md). Either gives you a client to render, and [Inspect an existing store in React](./guides/external-stores.md) shows the React side of the second path.

## Two ways to render

- The styled presets are quick. `DevtoolsStandalone` renders a floating toggle and panel inside a Shadow DOM, and `DevtoolsPanel` renders a tabbed panel inline. See [Add the standalone panel](./guides/standalone-panel.md) and [Build panel tabs](./guides/tabs.md).
- The headless primitives give you behavior without markup: visibility, focus handling, dragging, resizing and tab navigation. You supply the elements and the styles. See [Build a custom panel](./guides/headless-panel.md).

The standalone preset is the narrower of the two. It takes actions and your own CSS, but if you need an external store or a movable panel, use the headless path. The limits are listed in [What the preset does not support](./guides/standalone-panel.md#what-the-preset-does-not-support).

## What reaches production

By default the kit records nothing in production, and only `DevtoolsStandalone` gates its own rendering. See [Control the panel in production](./guides/production.md), and [Control devtools in production](../../javascript/v0/guides/production.md) for instrumentation.

## Where to go next

- New to the React package: [Installation](./installation.md), then the [Quick start](./quick-start.md), then [React concepts](./concepts.md).
- Showing the data in a panel: [Read the view model in React](./guides/view-models.md) and [Build panel tabs](./guides/tabs.md).
- Building your own UI: [Build a custom panel](./guides/headless-panel.md).
- Exact signatures: the [core API reference](./reference/index.md), the [React package reference](./plugins/react.md) and the [React headless reference](./plugins/react-headless.md).
