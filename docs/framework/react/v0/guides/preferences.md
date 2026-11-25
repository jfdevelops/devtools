---
title: Persist panel preferences
description: Save chosen panel settings such as size or dock position with a preference store, using storage you supply.
order: 100
---

Some panel settings are worth keeping between visits, such as where the panel sits or how large it is. The kit persists only what you ask it to, in storage you hand it, under a key you choose. It never saves your data sources, your commands or anything a user selects inside the panel.

In this guide you will:

- Create a preference store with your own storage.
- Load and save a value without a hydration mismatch.
- Feed a preference into a hook.
- Keep several windows in sync.

## Create a preference store

`createPreferenceStore` takes five options:

| Option | Meaning |
| --- | --- |
| `storage` | An object with `getItem`, `setItem` and `removeItem`. |
| `key` | The storage key. You own its name and its versioning. |
| `defaultValue` | The value used until something is loaded, and after a reset. |
| `parse` | Turns a stored string into a value. |
| `serialize` | Turns a value into a string. |

`storage` has the `PreferenceStorage` shape, which is the shape of the web Storage API. `window.localStorage` and `window.sessionStorage` satisfy it, and so would any object you write.

```ts
// src/layout-preference.ts
import { z } from 'zod';
import {
  createExternalStoreClient,
  createPreferenceStore,
  type PanelGeometry,
} from '@jfdevelops/devtools-kit-react/headless';

export const layoutKey = 'wizard-devtools:layout:v1';

const geometrySchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
});

const defaultGeometry: PanelGeometry = { x: 24, y: 24, width: 420, height: 320 };

export const layoutPreference = createPreferenceStore({
  storage: window.localStorage,
  key: layoutKey,
  defaultValue: defaultGeometry,
  parse: (serialized) => {
    try {
      const result = geometrySchema.safeParse(JSON.parse(serialized));

      return result.success ? result.data : defaultGeometry;
    } catch {
      return defaultGeometry;
    }
  },
  serialize: (value) => JSON.stringify(value),
});

export const layoutClient = createExternalStoreClient(layoutPreference);
```

Put a version in the key, as `:v1` does, so a later format change can use a new key instead of misreading old data.

`parse` owns validation and migration. The store does not catch errors from `parse` or from storage, so a corrupt value that throws in `parse` throws out of `refresh`. Return the default for anything you do not recognise, as the example does.

`createPreferenceStore` is exported from `@jfdevelops/devtools-kit` and from `@jfdevelops/devtools-kit-react/headless`. It is not exported from the React package's root entry. Import it from one of the other two.

`window.localStorage` only exists in a browser. If you render on the server, create the store in code that runs only in the browser.

## Load and save

Creating the store reads nothing. Its value is `defaultValue` until you call `refresh()`, which reads storage, runs `parse` and notifies subscribers if the value changed. Call it once after your component mounts. On the server and during hydration, the store's server snapshot is always the default, so the first render never depends on storage.

| Method | What it does |
| --- | --- |
| `getSnapshot()` | The current value. |
| `getServerSnapshot()` | Always `defaultValue`. |
| `subscribe(listener)` | Registers a listener. Returns an unsubscribe function. |
| `refresh()` | Reads storage, parses it, and notifies if the value changed. |
| `set(value)` | Writes `serialize(value)` to storage, and notifies if the value changed. |
| `reset()` | Removes the key, restores the default and always notifies. |

Notifications are synchronous, unlike the channel's. "Changed" means a different value under `Object.is`, so setting the same object again does nothing.

## Feed a preference into a hook

The store is an external store, so `createExternalStoreClient` wraps it, as the last line above does. Read it with `useDevtoolsViewModel`, and write it from a hook's `onChange`.

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

## Keep windows in sync

The store does not watch for changes made in another tab. The `storage` listener above does that for you: when another window writes your key, it calls `refresh()`. Remove the listener in the effect's cleanup, as shown.

## What to persist

Persist chosen preferences only. Do not persist sources, commands, previews or the data being inspected, and do not persist session state such as selection and search text. Treat anything you store as readable by other scripts on the page.

## Next steps

- [Drag, resize and dock a panel](./panel-layout.md) covers the geometry hook in the example.
- [Connect an existing store](./external-stores.md) explains clients built from stores.
- [`createPreferenceStore` reference](../reference/functions/createPreferenceStore.md) lists the signature.
