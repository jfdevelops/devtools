---
title: Drag, resize and dock a panel
description: Make a custom devtools panel movable, resizable and dockable with geometry and dock hooks and a presentation style helper.
order: 80
---

The standalone preset sits in a fixed corner. If your panel needs to move, resize or dock to an edge, build it from the headless primitives and add the layout hooks from this guide. The hooks calculate the layout and give you handlers. You apply them to your own elements.

In this guide you will:

- Track a panel's position and size with `usePanelGeometry`.
- Attach drag and resize handles.
- Dock the panel to an edge.
- Apply the result to a panel host.

This guide builds on [Build a custom panel](./headless-panel.md). The example renders the `RequestInspector` component from [Connect an existing store](./external-stores.md).

## Track geometry and attach handles

`usePanelGeometry` holds a `{ x, y, width, height }` rectangle and returns two prop getters, one for a drag handle and one for a resize handle.

```tsx
// src/floating-panel.tsx
import {
  DevtoolsClose,
  DevtoolsPanelContent,
  DevtoolsPanelRoot,
  DevtoolsTrigger,
  getPanelPresentationStyle,
  usePanelDock,
  usePanelGeometry,
  type PanelDock,
} from '@jfdevelops/devtools-kit-react/headless';
import { RequestInspector } from './request-inspector';

const docks: PanelDock[] = ['floating', 'left', 'right', 'bottom'];

export function FloatingPanel() {
  const { geometry, getDragHandleProps, getResizeHandleProps } =
    usePanelGeometry({
      defaultValue: { x: 24, y: 24, width: 420, height: 320 },
    });
  const [dock, setDock] = usePanelDock();
  const dragHandle = getDragHandleProps();
  const resizeHandle = getResizeHandleProps();

  return (
    <DevtoolsPanelRoot>
      <DevtoolsTrigger>Devtools</DevtoolsTrigger>
      <DevtoolsPanelContent
        aria-label="Request inspector"
        style={getPanelPresentationStyle(dock, geometry)}
      >
        <header style={{ display: 'flex' }}>
          <div {...dragHandle} style={{ ...dragHandle.style, flex: 1 }}>
            Requests
          </div>
          <DevtoolsClose>Close</DevtoolsClose>
        </header>
        <div>
          {docks.map((option) => (
            <button
              key={option}
              aria-pressed={dock === option}
              onClick={() => setDock(option)}
            >
              {option}
            </button>
          ))}
        </div>
        <RequestInspector />
        <div {...resizeHandle} style={{ ...resizeHandle.style, cursor: 'nwse-resize' }}>
          Resize
        </div>
      </DevtoolsPanelContent>
    </DevtoolsPanelRoot>
  );
}
```

Spread the getters onto elements that forward DOM props, such as a `div` or a `header`. They add `role="button"`, `tabIndex={0}`, an `aria-label` of `Move panel` or `Resize panel`, `touchAction: 'none'` in `style`, a keyboard handler and a pointer handler. If you set your own `style` or `role`, place it after the spread and merge `style` yourself, as both handles do. Keep the handle separate from other interactive elements. In the example the drag handle is a sibling of the close button, not its parent. A handle that contains a button would nest interactive elements, arrow keys pressed on the button would bubble up and move the panel, and the handle's pointer handling could swallow the button's click.

## What the handles do

| Input | Move handle | Resize handle |
| --- | --- | --- |
| Arrow keys | Move the panel 1 pixel. | Change width or height by 1 pixel. |
| Arrow keys with Shift | Move 10 pixels. | Change by 10 pixels. |
| Primary pointer drag | Move the panel. | Resize the panel. |

During a pointer drag the hook captures the pointer, so dragging keeps working when the pointer crosses an iframe. It removes its listeners when the pointer is released, the interaction is cancelled, pointer capture is lost, the window loses focus or the component unmounts.

## Constraints

Every change made through the handles, and every window resize, is constrained to the viewport of the handle's window:

- Width and height are never smaller than `minWidth` (default `160`) or `minHeight` (default `100`), and never larger than the viewport.
- `x` and `y` keep the whole panel inside the viewport.
- A geometry that is already valid keeps its object identity, and the hook ignores a change to an identical object. Pointer drags build a new object on every move, so `onChange` can run with a rectangle equal to the current one, for example while clamped at an edge.

`setGeometry`, the value the hook returns, is not constrained. If you call it with your own numbers, they are used as given.

The defaults are `{ x: 0, y: 0, width: 480, height: 320 }`. Pass `defaultValue` to change them. Like the other primitives, the hook is controlled with `value` and `onChange`, and `onChange` is not called when a prop changes. It runs for handle moves and keyboard changes, and also when a window resize forces the geometry to be constrained.

## Dock the panel

`usePanelDock` holds one of `'floating'`, `'left'`, `'right'` and `'bottom'` and starts as `'floating'`. It is a controllable state hook and nothing else. It does not move the panel, and it does not persist the choice.

`getPanelPresentationStyle(dock, geometry)` turns the pair into a style object for a `position: fixed` host:

| Dock | Result |
| --- | --- |
| `floating` | Positioned at `x` and `y`, sized by `width` and `height`. |
| `left` or `right` | Full viewport height, `geometry.width` wide, against that edge. |
| `bottom` | Full viewport width, `geometry.height` tall, against the bottom. |

Every style also sets `maxWidth: '100vw'` and `maxHeight: '100vh'`. The helper reserves no space on the page, so a docked panel covers the content under it. It applies no animation, so there is nothing to disable for reduced motion.

A docked panel ignores the part of the geometry it does not need. A bottom-docked panel uses only the height, so resizing it changes `height`, and dragging it changes `x` and `y` values that are then ignored.

## Persist the layout

To keep geometry or dock across page loads, control the hooks with `value` and `onChange` and store the result with a preference store. See [Persist panel preferences](./preferences.md).

## Next steps

- [Render in a portal or Shadow DOM](./hosts-and-styles.md) places the panel in a host of your choice.
- [Persist panel preferences](./preferences.md) saves the layout.
- [React headless reference](../plugins/react-headless.md#usepanelgeometry) lists the options and return values.
