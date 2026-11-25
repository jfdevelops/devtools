---
title: React headless reference
description: Exact signatures, props and behavior of the provider, hooks, panel primitives and hosts in the headless React entry point.
order: 20
---

This page documents `@jfdevelops/devtools-kit-react/headless`. The entry point has no styled presets and injects no CSS. It re-exports the whole core API, which is documented in the [core API reference](../reference/index.md), and its guides are in the [JavaScript docs](../../../javascript/v0/overview.md). Every export on this page, and the core API, is also exported from the root entry, `@jfdevelops/devtools-kit-react` (see [Core exports](./react.md#core-exports)). The presets and tab helpers that only the root has are in the [React package reference](./react.md).

```ts
import { DevtoolsProvider } from '@jfdevelops/devtools-kit-react/headless';
```

## Provider and hooks

### DevtoolsProvider

Binds one client, and optionally one action adapter, to a subtree. It renders no DOM and borrows its client: unmounting it removes only the subscriptions made under it.

```ts
function DevtoolsProvider<Actions extends ActionContract<Actions>>(
  props: DevtoolsProviderProps<Actions>,
): JSX.Element;
```

#### DevtoolsProviderProps

| Prop | Type | Required | Description |
| --- | --- | --- | --- |
| `children` | `ReactNode` | Yes | The subtree. |
| `client` | `DevtoolsClient<unknown>` | One of `client` or `devtools` | The client to bind. |
| `devtools` | `DevtoolsClient<unknown>` | One of `client` or `devtools` | An alias for `client`, the name used before 0.2.0. Pass exactly one of the two. |
| `actions` | `ActionAdapter<Actions>` | No | The action adapter. Without it, every action is unavailable. |

The provider creates its action client with `useMemo` keyed on the identity of `actions`, so pass a stable object. Providers are isolated: two providers with different clients do not share anything.

### useDevtools

Returns the nearest provider's client.

```ts
function useDevtools<VM = unknown>(): DevtoolsClient<VM>;
```

Throws `` `useDevtools` must be used inside a `<DevtoolsProvider>`. `` when there is no provider. `VM` is an assertion that nothing checks.

Changed in 0.2.0: this hook returns the structural `DevtoolsClient`, which has `subscribe`, `getViewModel` and an optional `getServerViewModel`. Channel-only members of `Devtools`, such as `getSnapshot` and `isActive`, are not available through it.

### useOptionalDevtools

Returns the nearest provider's client, or `null` when there is none.

```ts
function useOptionalDevtools<VM = unknown>(): DevtoolsClient<VM> | null;
```

Changed in 0.2.0: returns `DevtoolsClient`, as for `useDevtools`.

### useDevtoolsViewModel

Subscribes to a client and returns its current view model.

```ts
function useDevtoolsViewModel<VM = unknown>(instance?: DevtoolsClient<VM>): VM;
```

| Parameter | Type | Description |
| --- | --- | --- |
| `instance` | `DevtoolsClient<VM>` | Optional. When given, it is used instead of the provider's client, and `VM` is inferred from it. |

The hook uses `useSyncExternalStore`. On the server and during hydration it reads `getServerViewModel()` if the client has one, and `getViewModel()` otherwise. It throws `` `useDevtoolsViewModel` needs a `<DevtoolsProvider>` ancestor or an explicit instance. `` when it has neither a provider nor an instance.

### useDevtoolsActions

Returns the action client for the nearest provider.

```ts
function useDevtoolsActions<Actions extends ActionContract<Actions>>(): {
  isAvailable: <Key extends keyof Actions>(name: Key) => boolean;
  execute: <Key extends keyof Actions>(
    name: Key,
    ...args: Parameters<Actions[Key]>
  ) => Promise<Awaited<ReturnType<Actions[Key]>>>;
};
```

Throws `` `useDevtoolsActions` needs a `<DevtoolsProvider>`. `` when there is no provider. `Actions` is an assertion: nothing checks it against the adapter the provider received. `isAvailable` and `execute` read availability on each call. `execute` rejects with `UnavailableActionError` for an unavailable or missing action, and with the original error when an action fails.

## Panel visibility

### PanelStateOptions

The options for `usePanelState` and the props of `DevtoolsPanelRoot` besides `children`.

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `open` | `boolean` | None | Controls visibility. Uncontrolled while `undefined`. |
| `defaultOpen` | `boolean` | `false` | The initial visibility when uncontrolled. |
| `onOpenChange` | `(open: boolean) => void` | None | Called when a user interaction asks for a change. |

### usePanelState

Holds panel visibility without context.

```ts
function usePanelState(options?: PanelStateOptions): {
  open: boolean;
  setOpen: (next: boolean) => void;
  id: string;
  triggerRef: RefObject<HTMLButtonElement>;
};
```

`id` is generated and is used for `aria-controls` and for the content's `id`. `triggerRef` is the element focus returns to when `DevtoolsPanelContent` closes. `setOpen` does nothing if the value is unchanged.

### DevtoolsPanelRoot

Provides `usePanelState` to its descendants through context. It owns visibility only, and separate roots are independent.

```ts
function DevtoolsPanelRoot(
  props: PanelStateOptions & { children: ReactNode },
): JSX.Element;
```

### useDevtoolsPanel

Returns the same value as `usePanelState` from the nearest `DevtoolsPanelRoot`.

```ts
function useDevtoolsPanel(): ReturnType<typeof usePanelState>;
```

Throws `Panel interactions require DevtoolsPanelRoot.` outside a root.

### DevtoolsTrigger

A button that toggles the panel.

```ts
const DevtoolsTrigger: ForwardRefExoticComponent<
  ButtonHTMLAttributes<HTMLButtonElement> & RefAttributes<HTMLButtonElement>
>;
```

Renders a `button` with `type="button"`, `aria-expanded` and `aria-controls` set from the root, and records itself as the focus-return target when clicked. Your `onClick` runs first, and the toggle is skipped if it calls `event.preventDefault()`. Throws outside a root.

### DevtoolsClose

A button that closes the panel.

```ts
const DevtoolsClose: ForwardRefExoticComponent<
  ButtonHTMLAttributes<HTMLButtonElement> & RefAttributes<HTMLButtonElement>
>;
```

Renders a `button` with `type="button"`. Your `onClick` runs first, and closing is skipped if it calls `event.preventDefault()`. Throws outside a root.

### DevtoolsPanelContent

The panel body. It renders only while the panel is open.

```ts
const DevtoolsPanelContent: ForwardRefExoticComponent<
  HTMLAttributes<HTMLDivElement> & { modal?: boolean } & RefAttributes<HTMLDivElement>
>;
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `modal` | `boolean` | `false` | Dialog behavior: focuses the content on open, sets `role="dialog"` unless you pass `role`, sets `aria-modal`, wraps Tab and Shift+Tab inside, and pulls focus back when it moves outside. |
| `autoFocus` | `boolean` | `false` | Focuses the content when it opens, without containing focus. |
| `tabIndex` | `number` | `-1` | The content's `tabIndex`. |
| `onKeyDown` | `KeyboardEventHandler` | None | Runs first. If it calls `event.preventDefault()`, Escape and Tab handling is skipped. |

All other props go to the `div`. The `id` is always the root's `id`.

Behavior:

- Returns `null` while closed, so its children unmount.
- Escape closes the panel.
- When it closes or unmounts it moves focus back to the last `DevtoolsTrigger` that was clicked, even if the panel was later opened from code. If none was ever clicked, it moves focus to the element that had focus before it opened, provided that element is still in the document. That element is the `activeElement` of the content's root node, so inside a shadow root, focus that was outside it is not restored.
- It needs an accessible name when `modal`. Pass `aria-label` or `aria-labelledby`.
- It applies no styles.

Throws outside a root.

## Layout

### PanelGeometry

```ts
interface PanelGeometry {
  x: number;
  y: number;
  width: number;
  height: number;
}
```

### usePanelGeometry

Tracks a panel's rectangle and returns prop getters for drag and resize handles.

```ts
function usePanelGeometry(options?: {
  value?: PanelGeometry;
  defaultValue?: PanelGeometry;
  onChange?: (value: PanelGeometry) => void;
  minWidth?: number;
  minHeight?: number;
}): {
  geometry: PanelGeometry;
  setGeometry: (next: PanelGeometry) => void;
  getDragHandleProps: () => HTMLAttributes<HTMLElement>;
  getResizeHandleProps: () => HTMLAttributes<HTMLElement>;
};
```

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | `PanelGeometry` | None | Controls the geometry. |
| `defaultValue` | `PanelGeometry` | `{ x: 0, y: 0, width: 480, height: 320 }` | The initial geometry when uncontrolled. |
| `onChange` | `(value: PanelGeometry) => void` | None | Called for handle moves, keyboard changes and window-resize constraining, never because a prop changed. Pointer drags can call it with a rectangle equal to the current one, for example while clamped at an edge. |
| `minWidth` | `number` | `160` | The smallest width the handles and window resizes allow. |
| `minHeight` | `number` | `100` | The smallest height. |

Behavior:

- The handle props are `role="button"`, `tabIndex={0}`, `aria-label` set to `Move panel` or `Resize panel`, `style={{ touchAction: 'none' }}`, `onKeyDown` and `onPointerDown`.
- Arrow keys move or resize by 1 pixel, or 10 with Shift. A primary-button pointer drag moves or resizes using pointer capture.
- Listeners are removed when the pointer is released or cancelled, when pointer capture is lost, when the window blurs, and when the component unmounts.
- Changes from the handles, and window `resize` events in a browser, are constrained: width and height are limited to between the minimum and the viewport size, and the panel is kept inside the viewport. A geometry that needs no change keeps its identity. Pointer drags build a new object on every move, so `onChange` can run with a rectangle equal to the current one, for example while clamped at an edge.
- `setGeometry` is not constrained.
- The hook computes geometry only. Apply it yourself, for example with `getPanelPresentationStyle`.

### PanelDock

```ts
type PanelDock = 'floating' | 'left' | 'right' | 'bottom';
```

### usePanelDock

Holds the dock position. It is controllable state and nothing else: it does not persist and does not move anything.

```ts
function usePanelDock(options?: {
  value?: PanelDock;
  defaultValue?: PanelDock;
  onChange?: (dock: PanelDock) => void;
}): readonly [PanelDock, (next: PanelDock) => void];
```

The default value is `'floating'`.

### getPanelPresentationStyle

Returns a style object for a consumer-owned host.

```ts
function getPanelPresentationStyle(
  dock: PanelDock,
  geometry: PanelGeometry,
):
  | { position: 'fixed'; maxWidth: string; maxHeight: string; bottom: number; left: number; width: string; height: number }
  | { position: 'fixed'; maxWidth: string; maxHeight: string; top: number; width: number; height: string }
  | { position: 'fixed'; maxWidth: string; maxHeight: string; left: number; top: number; width: number; height: number };
```

The return type is the union the package's declarations give, one member per row of the table below. At run time the `'left'` and `'right'` result also sets that edge to `0`, which the declared type does not include.

| `dock` | Fields beyond `position: 'fixed'`, `maxWidth: '100vw'` and `maxHeight: '100vh'` |
| --- | --- |
| `'bottom'` | `bottom: 0`, `left: 0`, `width: '100%'`, `height: geometry.height` |
| `'left'` or `'right'` | `top: 0`, that edge set to `0`, `width: geometry.width`, `height: '100%'` |
| `'floating'` | `left: geometry.x`, `top: geometry.y`, `width: geometry.width`, `height: geometry.height` |

It reserves no page space and applies no animation.

## Tabs

### useDevtoolsTabs

Manages tab selection and returns the props for an accessible tab list.

```ts
function useDevtoolsTabs(options: {
  ids: readonly string[];
  value?: string;
  defaultValue?: string;
  onChange?: (id: string) => void;
}): {
  activeId: string;
  setActiveId: (next: string) => void;
  getTabProps: (id: string) => ButtonHTMLAttributes<HTMLButtonElement>;
  getPanelProps: (id: string) => {
    role: string;
    id: string;
    'aria-labelledby': string;
    hidden: boolean;
  };
};
```

| Option | Type | Description |
| --- | --- | --- |
| `ids` | `readonly string[]` | The tab ids, in order. Required. |
| `value` | `string` | Controls the selected id. |
| `defaultValue` | `string` | The initial id when uncontrolled. Defaults to the first id. |
| `onChange` | `(id: string) => void` | Called for user interactions only. |

Behavior:

- `activeId` is the selected id when it is in `ids`, and the first id otherwise. When `ids` is empty, `activeId` is `undefined` at run time even though it is typed `string`.
- `getTabProps` returns `role="tab"`, generated and linked `id` and `aria-controls`, `aria-selected`, a roving `tabIndex`, `onClick` and `onKeyDown`. Right and left arrows move to the next and previous tab and wrap. `Home` and `End` select the first and last. Focus moves to the selected tab.
- `getPanelProps` returns `role="tabpanel"`, `aria-labelledby`, and `hidden` for every id except the active one.
- You render the `role="tablist"` container.

## State

### useControllableState

The controlled and uncontrolled state hook the primitives use.

```ts
function useControllableState<Value>(options: {
  value?: Value;
  defaultValue: Value;
  onChange?: (value: Value) => void;
}): readonly [Value, (next: Value) => void];
```

The state is controlled when `value` is not `undefined`, so `undefined` cannot itself be a controlled value. The setter does nothing when the new value is `Object.is` equal to the current one. Otherwise it updates internal state, only when uncontrolled, and calls `onChange`. `onChange` is called from the setter only, never because a prop changed.

## Hosts

### DevtoolsPortal

Renders children into a container.

```ts
function DevtoolsPortal(props: {
  container: Element | DocumentFragment | null;
  children: ReactNode;
}): ReactPortal | null;
```

Renders nothing when `container` is `null`.

### DevtoolsShadowHost

Creates a child element with an open shadow root in a container, and renders children into it.

```ts
function DevtoolsShadowHost(props: {
  container: HTMLElement | null;
  children: ReactNode;
  css?: string;
  nonce?: string;
}): ReactPortal | null;
```

| Prop | Type | Description |
| --- | --- | --- |
| `container` | `HTMLElement \| null` | The element to append the host to. Nothing renders while it is `null`. |
| `children` | `ReactNode` | Rendered inside the shadow root. |
| `css` | `string` | Optional. Added to the shadow root as a `<style>` element. |
| `nonce` | `string` | Optional. The nonce for that `<style>` element. |

The host is created in an effect, so nothing renders during server rendering. It is removed when the component unmounts or `container` changes. There is no implicit body host: you own the container.
