---
title: Troubleshooting
description: Find the cause of an empty panel, a view model that never updates, unavailable actions and the errors the kit throws.
order: 130
---

Each entry names a symptom, its cause and the fix. Messages are quoted exactly as the kit produces them.

## The panel is empty or missing

Work through these causes in order.

- **It is a production build.** `DevtoolsStandalone` renders nothing in production unless you pass `enabled`, and channel instrumentation records nothing in production unless you pass `enabled: true` to `createDevtools`. See [Control devtools in production](./production.md).
- **The keys differ.** The library and the devtools package find each other through the `key` given to `createDevtools`. A different string means a different channel. Check that both sides use the same module or the same value.
- **The client is inert.** A client created with `{ channel: undefined }` has no channel, and its `isActive` is `false`. See [Test a devtools integration](./testing.md).
- **Instrumentation is switched off.** `enabled: false` stops recording in development too.
- **The client was created before a test cleared the global.** A client resolves its channel once, when it is created. If a test deletes the global afterwards, the client keeps reading the old channel.
- **You rendered `DevtoolsStandalone` on the server.** It creates its host in an effect, so it appears only after the page hydrates.

## A key that something else already uses

The channel is stored on `globalThis` under your `key`. If another value already lives at that name, the kit treats it as the channel without checking its shape. Writes then fail silently, because instrumentation errors are swallowed, and a client created for that key throws when it first reads a snapshot. Choose a distinctive key, such as `'__MY_LIBRARY_DEVTOOLS__'`, and do not reuse a name that other code might set.

## `ReferenceError: process is not defined`

The kit reads `process.env.NODE_ENV` directly, without checking that `process` exists. In a browser build where nothing replaces `process.env.NODE_ENV`, importing the package throws this error. Configure your bundler to replace `process.env.NODE_ENV` with a string. See [Installation](../installation.md#replace-processenvnode_env-in-your-bundler).

## The result of getSnapshot should be cached to avoid an infinite loop

Your external store returns a new snapshot object every time `getSnapshot` is called, even when the data has not changed. The client recomputes the view model for each new object and React re-renders every time. In React 18 it logs `The result of getSnapshot should be cached to avoid an infinite loop` and then throws `Maximum update depth exceeded`. Return the same object until the data changes. This also applies to `getServerSnapshot`. See [Connect an existing store](./external-stores.md).

## The view model never updates

- **Your store returns the same object after changing it.** The client compares snapshots with `Object.is`, so a mutated snapshot looks unchanged. Replace the snapshot instead of mutating it.
- **Your reducer reads outside state.** The view model is recomputed only when the snapshot changes. See [Derive a view model](./view-models.md).
- **You asserted on the UI too early in a test.** The channel notifies subscribers after a microtask. See [Test a devtools integration](./testing.md).

## `` `useDevtools` must be used inside a `<DevtoolsProvider>`. ``

You called `useDevtools` where no `DevtoolsProvider` is an ancestor. Wrap the component in a provider. Use `useOptionalDevtools` if the provider may be absent, since it returns `null` instead of throwing.

## `` `useDevtoolsViewModel` needs a `<DevtoolsProvider>` ancestor or an explicit instance. ``

`useDevtoolsViewModel` found neither a provider nor an argument. Add a provider, or pass the client: `useDevtoolsViewModel(client)`.

## `` `useDevtoolsActions` needs a `<DevtoolsProvider>`. ``

You called `useDevtoolsActions` outside a provider. Wrap the component in a `DevtoolsProvider`, and pass `actions` to it.

## `Panel interactions require DevtoolsPanelRoot.`

`DevtoolsTrigger`, `DevtoolsClose`, `DevtoolsPanelContent` or `useDevtoolsPanel` ran outside a `DevtoolsPanelRoot`. Render them inside a root, or use `usePanelState` if you want to manage the state yourself. See [Build a custom panel](./headless-panel.md).

## An action is always unavailable

`isAvailable` returns `false` and `execute` rejects with `UnavailableActionError`. Check these causes:

- **No `actions` prop.** A provider without `actions` makes every action unavailable.
- **The action is missing from the adapter**, or its `available` function returns `false`.
- **You are inside `DevtoolsStandalone`.** No action works there. See [What the preset does not support](./standalone-panel.md#what-the-preset-does-not-support).
- **The adapter is recreated on every render.** The provider memoises on the identity of `actions`, so create the adapter once.
- **Availability changed without a re-render.** Notify through your store so the controls render again. See [Add typed actions](./actions.md).

## `UnavailableActionError` or my own error

They mean different things. `UnavailableActionError` means the action was not available when you called it. Any other error is what your own `execute` function threw or rejected with. Catch both and treat them separately.

## `[devtools-kit] ... failed schema validation`

`validate: true` is on and a payload did not match its schema. The message reads `[devtools-kit] entity "step" failed schema validation` for an entity, and `[devtools-kit] event failed schema validation` for an event. The warning also logs the schema's issues and the value. The payload is still recorded.

If the schema has a transform or a default, the warning can be wrong: the kit validates the value as the schema's input, and the type you passed is the schema's output. See [TypeScript](../typescript.md#output-types-not-input-types).

## `[devtools-kit] async schema ... was skipped`

An asynchronous schema cannot be run during a synchronous write. The kit skips it and logs the warning, for example `[devtools-kit] async schema for entity "step" was skipped`. Use a synchronous schema if you want validation.

## Events disappear

The channel keeps only the newest events, 200 by default. Pass `maxEvents` to `createClient` to raise the cap. It applies to the shared channel, so it affects every reader of that key. See [Derive a view model](./view-models.md#limit-how-many-events-are-kept).

## `getSnapshot` or `isActive` is missing on the value from `useDevtools()`

Since 0.2.0, `useDevtools` and `useOptionalDevtools` return the structural `DevtoolsClient`, which has only `subscribe`, `getViewModel` and an optional `getServerViewModel`. `Devtools` methods such as `getSnapshot` and `isActive` are no longer reachable through context. `getViewModel` and `subscribe` are unchanged. If you need the channel-only methods, keep your original `Devtools` instance and import it where you need it.

## A type error when passing a client to `DevtoolsStandalone` or `DevtoolsPanel`

Their `devtools` prop is typed as the `Devtools` class. A client from `createExternalStoreClient` does not satisfy it. Give an external-store client to a `DevtoolsProvider` instead, and render `DevtoolsPanel` inside it. See [Connect an existing store](./external-stores.md) and, for `DevtoolsStandalone`, [What the preset does not support](./standalone-panel.md#what-the-preset-does-not-support).

## `vm` is `unknown` inside a tab factory

`createEventLogTab` and `createDiagnosticsTab` need the view model type. Pass it as a type argument: `createEventLogTab<WizardViewModel>({ ... })`. See [TypeScript](../typescript.md#tab-factories-need-the-view-model-type).

## `createPreferenceStore` is not exported from the React package

`@jfdevelops/devtools-kit-react` re-exports most of the core, but not `createPreferenceStore`, `PreferenceStorage` or `DEVTOOLS_CHANNEL_VERSION`. Import them from `@jfdevelops/devtools-kit` or `@jfdevelops/devtools-kit-react/headless`. See [Persist panel preferences](./preferences.md).

## Next steps

- [Core concepts](../concepts.md) explains the model behind these behaviors.
- [Control devtools in production](./production.md) explains what ships to production.
