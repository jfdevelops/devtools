---
title: Overview
description: What the core Devtools Kit package provides, the three pieces of code that use it, and which page to read first.
order: 10
---

A library that grows a devtools panel ends up building the same plumbing every time: a store the library writes into while it runs, a way for a UI to subscribe to that store, and a guarantee that none of it costs anything in production. Devtools Kit supplies that plumbing. Your library supplies what is specific to it: the data it exposes, how that data should look, and any commands the panel can run.

The kit never infers your data model, your UI or your commands. You describe your data with schemas, you decide what the panel shows, and you decide where it renders.

## Three roles

Most projects that use the kit have three separate pieces of code. They can live in one repository or three.

| Role | What it does | Imports |
| --- | --- | --- |
| Instrumented library | Describes its data with schemas and reports entities and events at the points where they happen. | `@jfdevelops/devtools-kit` |
| Devtools package | Turns the recorded data into a view model and renders it, either as tabs or as custom UI. | `@jfdevelops/devtools-kit-react`, or your own UI code using the core's clients |
| App | Renders the devtools component during development. | The devtools package |

The split matters because the instrumented library should not depend on React or on any UI. It only writes data. The devtools package reads that data and decides how to show it.

## What the core package contains

`@jfdevelops/devtools-kit` is framework-agnostic. It contains the dev-only channel that stores the data, the clients a UI subscribes to, typed actions, and an optional preference store. It has no React, DOM or storage dependency.

## Two ways to get data in

You can record data into the kit's own channel, or you can point the kit at a store your library already has.

- With the channel, your library calls `createDevtools` once, then reports entities and events as it runs. The channel lives on `globalThis` and only records in development unless you opt in. This path is covered by [Instrument a library](./guides/instrument-a-library.md).
- With an external store, you wrap an existing `subscribe` and `getSnapshot` source in `createExternalStoreClient`. Nothing is copied into the channel. This path is covered by [Connect an existing store](./guides/external-stores.md).

## Read the data from any UI

Either path gives you a client. A client has `subscribe` and `getViewModel`, so any framework, or plain DOM code, can read it, as the [Quick start](./quick-start.md) shows. The React package adds a provider, hooks and ready-made panels on top of the same clients. See the [React overview](../../react/v0/overview.md).

## What reaches production

By default the kit records nothing in production. What happens to your code depends on how you wrote the call sites, and the difference is covered in [Control devtools in production](./guides/production.md).

## Where to go next

- New to the kit: [Installation](./installation.md), then the [Quick start](./quick-start.md), then [Core concepts](./concepts.md).
- Adding instrumentation to a library: [Instrument a library](./guides/instrument-a-library.md).
- Inspecting a store you already have: [Connect an existing store](./guides/external-stores.md).
- Using React: the [React overview](../../react/v0/overview.md).
- Exact signatures: the [core API reference](./reference/index.md).
