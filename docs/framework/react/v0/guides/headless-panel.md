---
title: Build a custom panel
description: Compose your own devtools panel from unstyled primitives for visibility, focus, tabs and controlled state.
order: 60
---

The headless primitives give you the behavior of a devtools panel without its markup or styles. You decide what the panel looks like and where it sits, and the primitives handle open and close state, focus, the Escape key and tab navigation.

In this guide you will:

- Import the headless entry point.
- Compose a trigger, a close button and a panel body.
- Choose between modal and non-modal behavior.
- Add keyboard-accessible tabs.
- Manage your own state the same way the primitives do.

This guide assumes you have a client. [Derive a view model](../../../javascript/v0/guides/view-models.md) and [Connect an existing store](../../../javascript/v0/guides/external-stores.md) show how to create one. The examples render the `RequestInspector` component from [Inspect an existing store in React](./external-stores.md).

## Import from the headless entry point

Import from `@jfdevelops/devtools-kit-react/headless`.

```ts
import { DevtoolsPanelRoot } from '@jfdevelops/devtools-kit-react/headless';
```

This entry point contains the provider, the hooks, the panel primitives and the hosts. It has no presets and injects no CSS. The kit's tests build it with a real bundler and check that the output contains neither the panel styles nor `DevtoolsStandalone`. Every React export from this entry is also exported from the root entry, so you can switch later without changing names. The headless entry also exports the whole core API, but the root entry omits three of its exports: see [Core exports missing from the root entry](../plugins/react.md#core-exports-missing-from-the-root-entry).

An inspector does not need a panel at all. A `DevtoolsProvider` and a component that calls `useDevtoolsViewModel` is a complete inspector, and you can render it inline, as in [Inspect an existing store in React](./external-stores.md).

## Compose a panel

A panel has three parts. `DevtoolsPanelRoot` holds the open state. `DevtoolsTrigger` and `DevtoolsClose` change it. `DevtoolsPanelContent` is the body, and it renders only while the panel is open.

```tsx
// src/request-drawer.tsx
import {
  DevtoolsClose,
  DevtoolsPanelContent,
  DevtoolsPanelRoot,
  DevtoolsTrigger,
} from '@jfdevelops/devtools-kit-react/headless';
import { RequestInspector } from './request-inspector';

export function RequestDrawer() {
  return (
    <DevtoolsPanelRoot>
      <DevtoolsTrigger>Requests</DevtoolsTrigger>
      <DevtoolsPanelContent aria-label="Request inspector">
        <DevtoolsClose>Close</DevtoolsClose>
        <RequestInspector />
      </DevtoolsPanelContent>
    </DevtoolsPanelRoot>
  );
}
```

What each part does:

- `DevtoolsPanelRoot` owns only whether the panel is open. It takes `open`, `defaultOpen` (default `false`) and `onOpenChange`. It knows nothing about your data, so two roots that read the same client still open and close independently.
- `DevtoolsTrigger` is a button. It sets `aria-expanded`, points `aria-controls` at the content, toggles the panel, and remembers itself as the place focus returns to.
- `DevtoolsClose` is a button that closes the panel.
- `DevtoolsPanelContent` is a `div` that gets an `id` from the root, `tabIndex={-1}` unless you set one, and closes on Escape. When it closes or unmounts, it returns focus to the last `DevtoolsTrigger` that was clicked, even if the panel was later opened from code. If no trigger was ever clicked, it returns focus to the element that had focus before it opened, provided that element is still in the document. That element is read from the content's own root node, so inside a `DevtoolsShadowHost` focus that was outside the shadow root is not restored.

All three forward refs and accept the usual props of the element they render. The trigger and the close button run your `onClick` first, and skip their own behavior if you call `preventDefault()`. The content does the same for `onKeyDown`, so you can intercept Escape.

Because `DevtoolsPanelContent` returns nothing while closed, components inside it unmount when the panel closes, and their state resets. Keep state you want to survive in a component above the root.

Using `DevtoolsTrigger`, `DevtoolsClose` or `DevtoolsPanelContent` outside a root throws `Panel interactions require DevtoolsPanelRoot.`, and so does `useDevtoolsPanel` outside a root.

## Choose focus behavior

By default the content does not move focus, and it does not trap it. Two props change that, and both are opt-in.

| Prop | Behavior |
| --- | --- |
| `autoFocus` | Moves focus to the content when it opens. Focus can still leave. |
| `modal` | Moves focus to the content, sets `role="dialog"` and `aria-modal`, wraps Tab and Shift+Tab inside the content, and pulls focus back if it moves outside. |

A modal panel needs an accessible name. Pass `aria-label` or `aria-labelledby`, as the example does. You can override `role` yourself.

```tsx
// src/modal-drawer.tsx
import {
  DevtoolsPanelContent,
  DevtoolsPanelRoot,
  DevtoolsTrigger,
} from '@jfdevelops/devtools-kit-react/headless';

export function ModalDrawer() {
  return (
    <DevtoolsPanelRoot>
      <DevtoolsTrigger>Inspect</DevtoolsTrigger>
      <DevtoolsPanelContent modal aria-label="Inspector">
        <button>First control</button>
        <button>Second control</button>
      </DevtoolsPanelContent>
    </DevtoolsPanelRoot>
  );
}
```

## Control the open state

Pass `open` and `onOpenChange` to take over, or `defaultOpen` to start open.

```tsx
// src/controlled-drawer.tsx
import { useState } from 'react';
import {
  DevtoolsPanelContent,
  DevtoolsPanelRoot,
  DevtoolsTrigger,
} from '@jfdevelops/devtools-kit-react/headless';

export function ControlledDrawer() {
  const [open, setOpen] = useState(false);

  return (
    <DevtoolsPanelRoot open={open} onOpenChange={setOpen}>
      <DevtoolsTrigger>Inspect</DevtoolsTrigger>
      <DevtoolsPanelContent aria-label="Inspector">Content</DevtoolsPanelContent>
    </DevtoolsPanelRoot>
  );
}
```

`onOpenChange` runs only when the user asks for a change, through the trigger, the close button or Escape. It does not run when you change `open` from your own code, so you cannot create a feedback loop.

## Use your own markup

If you do not want a root, a trigger and a content element, use the hooks they are built on. `usePanelState` returns `{ open, setOpen, id, triggerRef }` and needs no context. `useDevtoolsPanel` returns the same value from the nearest root.

```tsx
// src/custom-toggle.tsx
import { usePanelState } from '@jfdevelops/devtools-kit-react/headless';

export function CustomToggle() {
  const { open, setOpen, id, triggerRef } = usePanelState();

  return (
    <>
      <button
        ref={triggerRef}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(!open)}
      >
        Devtools
      </button>
      {open ? <section id={id}>Custom panel body</section> : null}
    </>
  );
}
```

With your own markup you take over focus and Escape handling.

## Add keyboard-accessible tabs

`useDevtoolsTabs` manages which tab is selected and returns the props to spread onto your elements. You render the `role="tablist"` container and the markup.

```tsx
// src/request-tabs.tsx
import { useDevtoolsTabs } from '@jfdevelops/devtools-kit-react/headless';

const ids = ['requests', 'timing'];

export function RequestTabs() {
  const tabs = useDevtoolsTabs({ ids });

  return (
    <>
      <div role="tablist">
        {ids.map((id) => (
          <button key={id} {...tabs.getTabProps(id)}>
            {id}
          </button>
        ))}
      </div>
      {ids.map((id) => (
        <div key={id} {...tabs.getPanelProps(id)}>
          Content for {id}
        </div>
      ))}
    </>
  );
}
```

`getTabProps` sets `role="tab"`, linked ids, `aria-selected`, a roving `tabIndex`, a click handler and keyboard handling. Left and right arrows move to the previous and next tab and wrap around, `Home` and `End` jump to the ends, and focus follows the selection. `getPanelProps` sets `role="tabpanel"`, `aria-labelledby`, and `hidden` on every panel except the active one.

The hook is controlled or uncontrolled with `value`, `defaultValue` and `onChange`. The selection falls back to the first id when the selected id is not in `ids`. With an empty `ids` array there is no first id, and `activeId` is `undefined` at run time even though its type is `string`, so avoid passing an empty list.

## Keep your own session state

`useControllableState` is the hook the primitives use for their value, defaulting and change callbacks. It is exported so your components follow the same convention.

```tsx
// src/request-list.tsx
import { useControllableState } from '@jfdevelops/devtools-kit-react/headless';

export function SelectableList({
  ids,
  selectedId,
  onSelectedIdChange,
}: {
  ids: readonly string[];
  selectedId?: string;
  onSelectedIdChange?: (id: string) => void;
}) {
  const [selected, setSelected] = useControllableState({
    value: selectedId,
    defaultValue: '',
    onChange: onSelectedIdChange,
  });

  return (
    <ul>
      {ids.map((id) => (
        <li key={id}>
          <button aria-pressed={id === selected} onClick={() => setSelected(id)}>
            {id}
          </button>
        </li>
      ))}
    </ul>
  );
}
```

The state is controlled when `value` is not `undefined`, so `undefined` cannot itself be a controlled value. Setting the value it already has does nothing, and the change callback runs only from the setter.

Selection, search text and expanded rows are session state. The kit never stores them, and each panel owns its own.

## Next steps

- [Drag, resize and dock a panel](./panel-layout.md) adds movement and docking.
- [Render in a portal or Shadow DOM](./hosts-and-styles.md) chooses where the panel renders.
- [React headless reference](../plugins/react-headless.md) lists every primitive and its props.
