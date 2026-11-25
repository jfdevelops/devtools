---
title: React concepts
description: What the React package adds to the core model, including the provider, presets, headless primitives, hosts and controlled state.
order: 40
---

This page covers the React layer on top of the core model. Read [Core concepts](../../javascript/v0/concepts.md) first, because it defines the channel, clients, view models and actions used here.

In short: a library records into a channel, or you wrap an existing store. A client gives a memoised view model and notifies subscribers. Actions are a separate command path. The React package connects a client to components.

## From client to component

```text
client.getViewModel() = reduce(snapshot), memoised
          │ subscribe (batched per microtask)
          ▼
DevtoolsProvider ─▶ useDevtoolsViewModel ─▶ tabs and custom components
          │
useDevtoolsActions().execute(name, ...args) ──▶ action adapter ──▶ library
```

## The provider

A `DevtoolsProvider` binds one client and one action adapter to a subtree. It creates no DOM. Two providers with different clients are independent, so two inspectors in one app never share state. The provider borrows the client, so unmounting it removes only that provider's subscriptions.

## Presets and headless primitives

On top of the provider the React package offers two layers:

- **Presets** are styled and ready to use. `DevtoolsPanel` renders tabbed content inline with its own stylesheet. `DevtoolsStandalone` renders a floating toggle and panel in a Shadow DOM.
- **Headless primitives** supply behavior without markup or styles: panel visibility, a trigger and close button, focus handling, geometry, docking and tab navigation. They are what the presets are built from.

## Hosts

The **host** is where the content renders. You can render inline, into a container with `DevtoolsPortal`, or into a Shadow DOM with `DevtoolsShadowHost`. The standalone preset creates its own host. See [Render in a portal or Shadow DOM](./guides/hosts-and-styles.md).

## Session state and controlled props

Anything a user does inside the panel, such as selecting a row, typing a search or expanding a node, is session state. It belongs to your React components and is never persisted. The few settings worth keeping persist only through a preference store, as [Core concepts](../../javascript/v0/concepts.md#session-state-and-preferences) describes.

Every interaction primitive takes the usual controlled and uncontrolled props: `value`, `defaultValue` and `onChange`, or `open`, `defaultOpen` and `onOpenChange`. The change callback is for changes the user asks for (and, for geometry, when a window resize forces the panel back inside the viewport), and is never called because a prop changed.

## What renders in production

Among the React exports only `DevtoolsStandalone` gates its own rendering. Everything else renders where you put it. See [Control the panel in production](./guides/production.md).

## Next steps

- [Read the view model in React](./guides/view-models.md) reads a client from a provider.
- [Add the standalone panel](./guides/standalone-panel.md) renders the floating preset.
- [Build a custom panel](./guides/headless-panel.md) composes the headless primitives.
- [Render in a portal or Shadow DOM](./guides/hosts-and-styles.md) chooses where content renders.
- [TypeScript](./typescript.md) explains where React context cannot check types.
