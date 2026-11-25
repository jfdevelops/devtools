---
title: Troubleshooting
description: Find the cause of nothing being recorded, a view model that never updates, unavailable actions and the errors the kit logs.
order: 80
---

Each entry names a symptom, its cause and the fix. Messages are quoted exactly as the kit produces them. For errors from the React package, see the [React troubleshooting](../../../react/v0/guides/troubleshooting.md) page.

## Nothing is recorded

Work through these causes in order.

- **It is a production build.** Channel instrumentation records nothing in production unless you pass `enabled: true` to `createDevtools`. See [Control devtools in production](./production.md).
- **The keys differ.** The library and the code that reads it find each other through the `key` given to `createDevtools`. A different string means a different channel. Check that both sides use the same module or the same value.
- **The client is inert.** A client created with `{ channel: undefined }` has no channel, and its `isActive` is `false`. See [Test instrumentation and clients](./testing.md).
- **Instrumentation is switched off.** `enabled: false` stops recording in development too.
- **The client was created before a test cleared the global.** A client resolves its channel once, when it is created. If a test deletes the global afterwards, the client keeps reading the old channel.

## A key that something else already uses

The channel is stored on `globalThis` under your `key`. If another value already lives at that name, the kit treats it as the channel without checking its shape. Writes then fail silently, because instrumentation errors are swallowed, and a client created for that key throws when it first reads a snapshot. Choose a distinctive key, such as `'__MY_LIBRARY_DEVTOOLS__'`, and do not reuse a name that other code might set.

## `ReferenceError: process is not defined`

The kit reads `process.env.NODE_ENV` directly, without checking that `process` exists. In a browser build where nothing replaces `process.env.NODE_ENV`, importing the package throws this error. Configure your bundler to replace `process.env.NODE_ENV` with a string. See [Installation](../installation.md#replace-processenvnode_env-in-your-bundler).

## The view model never updates

- **Your store returns the same object after changing it.** The client compares snapshots with `Object.is`, so a mutated snapshot looks unchanged. Replace the snapshot instead of mutating it.
- **Your reducer reads outside state.** The view model is recomputed only when the snapshot changes. See [Derive a view model](./view-models.md).
- **You asserted too early in a test.** The channel notifies subscribers after a microtask. See [Test instrumentation and clients](./testing.md).

## An action is always unavailable

`isAvailable` returns `false` and `execute` rejects with `UnavailableActionError`. Check these causes:

- **The action is missing from the adapter**, or its `available` function returns `false`.
- **Availability changed without your UI rendering again.** Notify through your store so the controls update. See [Add typed actions](./actions.md).

In React, a missing `actions` prop can also cause this. See the [React troubleshooting](../../../react/v0/guides/troubleshooting.md#an-action-is-always-unavailable) entry.

## `UnavailableActionError` or my own error

They mean different things. `UnavailableActionError` means the action was not available when you called it. Any other error is what your own `execute` function threw or rejected with. Catch both and treat them separately.

## `[devtools-kit] ... failed schema validation`

`validate: true` is on and a payload did not match its schema. The message reads `[devtools-kit] entity "step" failed schema validation` for an entity, and `[devtools-kit] event failed schema validation` for an event. The warning also logs the schema's issues and the value. The payload is still recorded.

If the schema has a transform or a default, the warning can be wrong: the kit validates the value as the schema's input, and the type you passed is the schema's output. See [TypeScript](../typescript.md#output-types-not-input-types).

## `[devtools-kit] async schema ... was skipped`

An asynchronous schema cannot be run during a synchronous write. The kit skips it and logs the warning, for example `[devtools-kit] async schema for entity "step" was skipped`. Use a synchronous schema if you want validation.

## Events disappear

The channel keeps only the newest events, 200 by default. Pass `maxEvents` to `createClient` to raise the cap. It applies to the shared channel, so it affects every reader of that key. See [Derive a view model](./view-models.md#limit-how-many-events-are-kept).

## Next steps

- [Core concepts](../concepts.md) explains the model behind these behaviors.
- [Control devtools in production](./production.md) explains what ships to production.
