---
title: Troubleshooting
description: Find the cause of an empty or missing panel, hook errors, unavailable actions and the type errors the React package produces.
order: 120
---

Each entry names a symptom, its cause and the fix. Messages are quoted exactly as the kit produces them. For instrumentation and client errors, such as `process is not defined`, validation warnings or lost events, see the [JavaScript troubleshooting](../../../javascript/v0/guides/troubleshooting.md) page.

## The panel is empty or missing

Work through these causes in order.

- **Nothing is being recorded.** See [Nothing is recorded](../../../javascript/v0/guides/troubleshooting.md#nothing-is-recorded).
- **It is a production build.** `DevtoolsStandalone` renders nothing in production unless you pass `enabled`. See [Control the panel in production](./production.md).
- **You rendered `DevtoolsStandalone` on the server.** It creates its host in an effect, so it appears only after the page hydrates.

## The result of getSnapshot should be cached to avoid an infinite loop

Your external store returns a new snapshot object every time `getSnapshot` is called, even when the data has not changed. The client recomputes the view model for each new object and React re-renders every time. In React 18 it logs `The result of getSnapshot should be cached to avoid an infinite loop` and then throws `Maximum update depth exceeded`. Return the same object until the data changes. This also applies to `getServerSnapshot`. See [Connect an existing store](../../../javascript/v0/guides/external-stores.md), and [Inspect an existing store in React](./external-stores.md) for creating the client once.

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
- **You are inside `DevtoolsStandalone`.** No action works there. See [What the preset does not support](./standalone-panel.md#what-the-preset-does-not-support).
- **Availability changed without a re-render.** Notify through your store so the controls render again. See [Call actions from React](./actions.md).
- **The adapter itself is the cause.** See [An action is always unavailable](../../../javascript/v0/guides/troubleshooting.md#an-action-is-always-unavailable) for a missing entry or an `available` function that returns `false`.

## `getSnapshot` or `isActive` is missing on the value from `useDevtools()`

Since 0.2.0, `useDevtools` and `useOptionalDevtools` return the structural `DevtoolsClient`, which has only `subscribe`, `getViewModel` and an optional `getServerViewModel`. `Devtools` methods such as `getSnapshot` and `isActive` are no longer reachable through context. `getViewModel` and `subscribe` are unchanged. If you need the channel-only methods, keep your original `Devtools` instance and import it where you need it.

## A type error when passing a client to `DevtoolsStandalone` or `DevtoolsPanel`

Their `devtools` prop is typed as the `Devtools` class. A client from `createExternalStoreClient` does not satisfy it. Give an external-store client to a `DevtoolsProvider` instead, and render `DevtoolsPanel` inside it. See [Inspect an existing store in React](./external-stores.md) and, for `DevtoolsStandalone`, [What the preset does not support](./standalone-panel.md#what-the-preset-does-not-support).

## `vm` is `unknown` inside a tab factory

`createEventLogTab` and `createDiagnosticsTab` need the view model type. Pass it as a type argument: `createEventLogTab<WizardViewModel>({ ... })`. See [TypeScript](../typescript.md#tab-factories-need-the-view-model-type).

## `createPreferenceStore` is not exported from the React package

In version 0.2.0, the root entry of `@jfdevelops/devtools-kit-react` did not re-export `createPreferenceStore`, `PreferenceStorage` or `DEVTOOLS_CHANNEL_VERSION`. Later releases re-export the whole core API, so upgrade the React package, or import them from `@jfdevelops/devtools-kit` or `@jfdevelops/devtools-kit-react/headless`. See [Persist panel layout](./preferences.md).

## Next steps

- [React concepts](../concepts.md) explains the model behind these behaviors.
- [Control the panel in production](./production.md) explains what the components render in production.
- [JavaScript troubleshooting](../../../javascript/v0/guides/troubleshooting.md) covers instrumentation and client errors.
