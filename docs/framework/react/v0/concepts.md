---
title: Core concepts
description: The mental model behind the kit, including channels, clients, view models, actions, providers and the three production outcomes.
order: 40
---

This page answers one question: how does data get from your library to a panel, and what owns each step? The rest of the docs build on the terms defined here.

## The three roles

The kit assumes three pieces of code with different jobs.

- The **instrumented library** describes its data with schemas and reports it as it runs. It never touches UI.
- The **devtools package** turns that data into a view model and renders it. It owns every decision about what the panel shows.
- The **app** renders the devtools component, normally only in development.

The kit supplies the plumbing between them. It does not infer your data model, your inspector UI or your commands. Graph nodes, requests, form steps or routes stay your own domain concepts, and you decide how they appear.

## How data flows

```text
library ── putEntity / removeEntity / emit ──▶ channel (globalThis[key])
                                                │ snapshot (stable until a change)
                                                ▼
                              client.getViewModel() = reduce(snapshot), memoised
                                                │ subscribe (batched per microtask)
                                                ▼
              DevtoolsProvider ─▶ useDevtoolsViewModel ─▶ tabs and custom components
                                                │
UI ── useDevtoolsActions().execute(name, ...args) ──▶ action adapter ──▶ library
```

An existing store can replace the left half. `createExternalStoreClient` wraps a `subscribe` and `getSnapshot` source directly, with no channel.

## The channel

The channel is an in-memory store installed on `globalThis` under a string you choose, the **channel key**. `createDevtools({ key })` returns the handle your library writes through. The channel is installed the first time something writes to it or creates a client for it. Any code that knows the key shares the same channel, even across separately bundled copies of your library or the kit.

That sharing is deliberate: the library and its devtools package can be separate bundles and still meet in the same place. It also means the key must be unique, and that the channel is process-wide state. The kit does not check what it finds at the key: a non-channel value already stored there is used as the channel, and writes to it fail silently. If you render on a server during development, every request in that process shares one channel.

The channel holds two kinds of data:

- **Entities** are long-lived items in named **collections**, keyed by id. `putEntity` inserts or replaces the item with that id, and `removeEntity` deletes it. Each collection has a schema.
- **Events** are transient records appended with `emit`. The channel keeps the newest `maxEvents`, 200 by default. Events usually form a discriminated union on a `type` field.

Each channel carries a `version` field set from `DEVTOOLS_CHANNEL_VERSION`. The kit does not check it when it reuses an existing global, so treat it as a label for the channel's shape, not as a compatibility guard.

## Snapshots and notifications

Every write rebuilds an immutable **snapshot**, `{ entities, events }`. Reading is always current: `getSnapshot()` reflects a write immediately. A snapshot keeps the same object identity until the next change, which is what lets React and the client skip work.

Subscribers are notified later. The channel batches notifications, so several writes in the same tick call each listener once, after a microtask. Code that asserts on UI driven by a subscription needs to wait for that microtask. [Test a devtools integration](./guides/testing.md) shows how.

## Clients and view models

A **client** is the read boundary a UI subscribes to. It has `subscribe`, `getViewModel` and, optionally, `getServerViewModel`. The `DevtoolsClient` interface describes it, and there are two kinds:

- A **channel client** is a `Devtools` instance from `devtools.createClient(reduce)`.
- An **external-store client** comes from `createExternalStoreClient(source, select)`.

A **view model** is the UI-shaped value a client derives. In a channel client the function that derives it is called a **reducer**. In an external-store client it is called a **projection**. Either way the result is memoised on the identity of the snapshot, so the same snapshot always gives the same view model object. This is what makes `getViewModel` safe to use as a React `useSyncExternalStore` getter, and it is why a reducer must be a pure function of the snapshot.

Clients are **borrowed**. A client never owns or disposes its source, and it does not subscribe until a consumer does. Each subscriber cleans up only its own subscription.

## Actions

Reading and commanding are separate paths. **Actions** are typed commands your library exposes to the inspector, such as retrying a request or jumping to a step. You describe them in three parts:

- An **action contract** is a TypeScript type that maps names to function types.
- An **action adapter** supplies `execute`, and optionally `available`, for each name.
- An **action client** offers `isAvailable(name)` and an async `execute(name, ...args)`.

An action that is missing or reports itself unavailable rejects with `UnavailableActionError`. An action that runs and fails rejects with its original error, so your UI can tell the two apart. See [Add typed actions](./guides/actions.md).

## Providers, presets and primitives

In React, a `DevtoolsProvider` binds one client and one action adapter to a subtree. It creates no DOM. Two providers with different clients are independent, so two inspectors in one app never share state.

On top of the provider the React package offers two layers:

- **Presets** are styled and ready to use. `DevtoolsPanel` renders tabbed content inline with its own stylesheet. `DevtoolsStandalone` renders a floating toggle and panel in a Shadow DOM.
- **Headless primitives** supply behavior without markup or styles: panel visibility, a trigger and close button, focus handling, geometry, docking and tab navigation. They are what the presets are built from.

The **host** is where the content renders. You can render inline, into a container with `DevtoolsPortal`, or into a Shadow DOM with `DevtoolsShadowHost`. The standalone preset creates its own host. See [Render in a portal or Shadow DOM](./guides/hosts-and-styles.md).

## Session state and preferences

Anything a user does inside the panel, such as selecting a row, typing a search or expanding a node, is **session state**. It belongs to your React components and is never persisted.

**Preferences** are the few settings worth keeping, such as panel size or dock position. They persist only through an explicit preference store that you configure with your own storage and key. See [Persist panel preferences](./guides/preferences.md).

Every interaction primitive takes the usual controlled and uncontrolled props: `value`, `defaultValue` and `onChange`, or `open`, `defaultOpen` and `onOpenChange`. The change callback is for changes the user asks for (and, for geometry, when a window resize forces the panel back inside the viewport), and is never called because a prop changed.

## What happens in production

"Enabled" means instrumentation records data. By default it records in development and not in production. In a production build there are three distinct outcomes:

| Outcome | How you get it | What ships |
| --- | --- | --- |
| Excluded | Guard call sites with `if (IS_DEV)`. | The guarded code is removed from the bundle. |
| No-op | Call the API unguarded. | The code ships, but nothing records and no global is installed. |
| Opt-in | Pass `enabled: true` to `createDevtools`. | Instrumentation keeps working in production. |

External-store clients are different: they are always live, because the source belongs to you. Among the React exports only `DevtoolsStandalone` gates its own rendering. See [Control devtools in production](./guides/production.md).

## Next steps

- [Instrument a library](./guides/instrument-a-library.md) puts the channel to use.
- [Derive a view model](./guides/view-models.md) covers reducers and clients.
- [Connect an existing store](./guides/external-stores.md) covers the external path.
- [TypeScript](./typescript.md) explains which types are inferred and which you assert.
- The [core API reference](./reference/index.md) lists every export.
