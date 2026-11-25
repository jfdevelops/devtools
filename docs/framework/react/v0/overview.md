---
title: Overview
description: What Devtools Kit provides, which package each part of your project uses, and which page to read first.
order: 10
---

A library that grows a devtools panel ends up building the same plumbing every time: a store the library writes into while it runs, a way for a UI to subscribe to that store, a panel with tabs, and a guarantee that none of it costs anything in production. Devtools Kit supplies that plumbing. Your library supplies what is specific to it: the data it exposes, how that data should look, and any commands the panel can run.

The kit never infers your data model, your UI or your commands. You describe your data with schemas, you decide what the panel shows, and you decide where it renders.

## Three roles

Most projects that use the kit have three separate pieces of code. They can live in one repository or three.

| Role | What it does | Imports |
| --- | --- | --- |
| Instrumented library | Describes its data with schemas and reports entities and events at the points where they happen. | `@jfdevelops/devtools-kit` |
| Devtools package | Turns the recorded data into a view model and renders it, either as tabs or as custom UI. | `@jfdevelops/devtools-kit-react` |
| App | Renders the devtools component during development. | The devtools package |

The split matters because the instrumented library should not depend on React or on any UI. It only writes data. The devtools package reads that data and decides how to show it.

## Two packages and two React entry points

`@jfdevelops/devtools-kit` is framework-agnostic. It contains the dev-only channel that stores the data, the clients a UI subscribes to, typed actions, and an optional preference store. It has no React, DOM or storage dependency.

`@jfdevelops/devtools-kit-react` adds React on top, through two entry points:

| Entry point | Contains | Use it when |
| --- | --- | --- |
| `@jfdevelops/devtools-kit-react` | The provider and hooks, the headless primitives, the styled presets (`DevtoolsStandalone` and `DevtoolsPanel`), and most of the core API re-exported. | You want a working floating panel quickly, or an inline tabbed panel. |
| `@jfdevelops/devtools-kit-react/headless` | The provider and hooks, the headless primitives and the portal and Shadow DOM hosts, plus the whole core API. No presets and no CSS. | You are composing your own panel, or rendering inside another devtools host. |

## Two ways to get data in

You can record data into the kit's own channel, or you can point the kit at a store your library already has.

- With the channel, your library calls `createDevtools` once, then reports entities and events as it runs. The channel lives on `globalThis` and only records in development unless you opt in. This path is covered by [Instrument a library](./guides/instrument-a-library.md).
- With an external store, you wrap an existing `subscribe` and `getSnapshot` source in `createExternalStoreClient`. Nothing is copied into the channel. This path is covered by [Connect an existing store](./guides/external-stores.md).

## Two ways to render

- The styled presets are quick. `DevtoolsStandalone` renders a floating toggle and panel inside a Shadow DOM, and `DevtoolsPanel` renders a tabbed panel inline. See [Add the standalone panel](./guides/standalone-panel.md) and [Build panel tabs](./guides/tabs.md).
- The headless primitives give you behavior without markup: visibility, focus handling, dragging, resizing and tab navigation. You supply the elements and the styles. See [Build a custom panel](./guides/headless-panel.md).

The standalone preset is the narrower of the two. If you need actions, an external store, or a movable panel, use the headless path. The limits are listed in [What the preset does not support](./guides/standalone-panel.md#what-the-preset-does-not-support).

## What reaches production

By default the kit records nothing in production. What happens to your code depends on how you wrote the call sites, and the difference is covered in [Control devtools in production](./guides/production.md).

## Where to go next

- New to the kit: [Installation](./installation.md), then the [Quick start](./quick-start.md), then [Core concepts](./concepts.md).
- Adding instrumentation to a library: [Instrument a library](./guides/instrument-a-library.md).
- Showing the data in a panel: [Derive a view model](./guides/view-models.md) and [Build panel tabs](./guides/tabs.md).
- Building your own UI: [Build a custom panel](./guides/headless-panel.md).
- Exact signatures: the [core API reference](./reference/index.md), the [React package reference](./plugins/react.md) and the [React headless reference](./plugins/react-headless.md).
