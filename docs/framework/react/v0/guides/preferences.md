---
title: Persist panel layout
description: Save a panel's position and size with a preference store and feed the stored value into the geometry hook.
order: 90
---

A panel's position and size are worth keeping between visits. This guide feeds a preference store into the geometry hook, so the panel reopens where the user left it.

It uses `layoutPreference`, `layoutClient` and `layoutKey` from [Persist preferences](../../../javascript/v0/guides/preferences.md). That page's `Layout` type has the same shape as `PanelGeometry`, so the two are interchangeable.

In this guide you will:

- Feed a preference into a hook.
- Load the stored value after mount.

`createPreferenceStore` is exported from `@jfdevelops/devtools-kit` and from both React entry points. In 0.2.0 the React root entry did not export it; on that version, import it from the core package or from `@jfdevelops/devtools-kit-react/headless`.

## Feed a preference into a hook

The store is an external store, so `createExternalStoreClient` wraps it, as the last line of `src/layout-preference.ts` does. Read it with `useDevtoolsViewModel`, and write it from a hook's `onChange`.

```tsx
// src/persisted-panel.tsx
import { useEffect } from 'react';
import {
  DevtoolsPanelContent,
  DevtoolsPanelRoot,
  DevtoolsTrigger,
  getPanelPresentationStyle,
  useDevtoolsViewModel,
  usePanelGeometry,
} from '@jfdevelops/devtools-kit-react/headless';
import {
  layoutClient,
  layoutKey,
  layoutPreference,
} from './layout-preference';

export function PersistedPanel() {
  const stored = useDevtoolsViewModel(layoutClient);
  const { geometry, getDragHandleProps } = usePanelGeometry({
    value: stored,
    onChange: (next) => layoutPreference.set(next),
  });

  useEffect(() => {
    layoutPreference.refresh();

    function onStorage(event: StorageEvent) {
      if (event.key === layoutKey) {
        layoutPreference.refresh();
      }
    }

    window.addEventListener('storage', onStorage);

    return () => window.removeEventListener('storage', onStorage);
  }, []);

  return (
    <DevtoolsPanelRoot>
      <DevtoolsTrigger>Devtools</DevtoolsTrigger>
      <DevtoolsPanelContent
        aria-label="Inspector"
        style={getPanelPresentationStyle('floating', geometry)}
      >
        <header {...getDragHandleProps()}>Drag to move</header>
      </DevtoolsPanelContent>
    </DevtoolsPanelRoot>
  );
}
```

The loaded geometry is used as it is. The hook constrains geometry only when a handle moves it or the window resizes, so a stored rectangle that no longer fits the viewport, for example after the window shrank, can open partly or fully off screen until then. If that matters, check the values in `parse` and fall back to the default for any rectangle that is negative or larger than the viewport. The geometry hook is controlled here. It asks for a change through `onChange`, the store saves and notifies, and the new value comes back as `value`.

The effect also keeps windows in sync, with the `storage` listener from [Keep windows in sync](../../../javascript/v0/guides/preferences.md#keep-windows-in-sync). Its cleanup removes the listener.

## Load after mount

Calling `refresh()` in an effect, as above, keeps the first render on the default layout, and the stored value arrives in a second render. The store's server snapshot is always the default, so the first render never depends on storage.

This example is client-only. `src/layout-preference.ts` reads `window.localStorage` when the module loads, so importing it in code that runs on the server throws. Import it only from browser-only code, as [Create a preference store](../../../javascript/v0/guides/preferences.md#create-a-preference-store) notes.

## Next steps

- [Drag, resize and dock a panel](./panel-layout.md) covers the geometry hook in the example.
- [Persist preferences](../../../javascript/v0/guides/preferences.md) covers the store's options and methods.
