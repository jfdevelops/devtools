---
title: Persist preferences
description: Save chosen settings such as panel size or dock position with a preference store, using storage you supply.
order: 50
---

Some settings are worth keeping between visits, such as where a panel sits or how large it is. The kit persists only what you ask it to, in storage you hand it, under a key you choose. It never saves your data sources, your commands or anything a user selects inside the inspector.

In this guide you will:

- Create a preference store with your own storage.
- Load and save a value without a hydration mismatch.
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
} from '@jfdevelops/devtools-kit';

export type Layout = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export const layoutKey = 'wizard-devtools:layout:v1';

const layoutSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
});

const defaultLayout: Layout = { x: 24, y: 24, width: 420, height: 320 };

export const layoutPreference = createPreferenceStore({
  storage: window.localStorage,
  key: layoutKey,
  defaultValue: defaultLayout,
  parse: (serialized) => {
    try {
      const result = layoutSchema.safeParse(JSON.parse(serialized));

      return result.success ? result.data : defaultLayout;
    } catch {
      return defaultLayout;
    }
  },
  serialize: (value) => JSON.stringify(value),
});

export const layoutClient = createExternalStoreClient(layoutPreference);
```

Put a version in the key, as `:v1` does, so a later format change can use a new key instead of misreading old data.

`parse` owns validation and migration. The store does not catch errors from `parse` or from storage, so a corrupt value that throws in `parse` throws out of `refresh`. Return the default for anything you do not recognise, as the example does.

`window.localStorage` only exists in a browser. If you render on the server, create the store in code that runs only in the browser.

## Load and save

Creating the store reads nothing. Its value is `defaultValue` until you call `refresh()`, which reads storage, runs `parse` and notifies subscribers if the value changed. Call it once after your UI mounts. On the server and during hydration, the store's server snapshot is always the default, so the first render never depends on storage.

| Method | What it does |
| --- | --- |
| `getSnapshot()` | The current value. |
| `getServerSnapshot()` | Always `defaultValue`. |
| `subscribe(listener)` | Registers a listener. Returns an unsubscribe function. |
| `refresh()` | Reads storage, parses it, and notifies if the value changed. |
| `set(value)` | Writes `serialize(value)` to storage, and notifies if the value changed. |
| `reset()` | Removes the key, restores the default and always notifies. |

Notifications are synchronous, unlike the channel's. "Changed" means a different value under `Object.is`, so setting the same object again does nothing.

## Keep windows in sync

The store does not watch for changes made in another tab. A `storage` listener can do that: when another window writes your key, it calls `refresh()`.

```ts
// src/layout-sync.ts
import { layoutKey, layoutPreference } from './layout-preference';

export function syncLayoutAcrossWindows() {
  function onStorage(event: StorageEvent) {
    if (event.key === layoutKey) {
      layoutPreference.refresh();
    }
  }

  window.addEventListener('storage', onStorage);

  return () => window.removeEventListener('storage', onStorage);
}
```

Call the returned function when you no longer need the sync, for example when you tear down your UI.

## What to persist

Persist chosen preferences only. Do not persist sources, commands, previews or the data being inspected, and do not persist session state such as selection and search text. Treat anything you store as readable by other scripts on the page.

## Next steps

- [Connect an existing store](./external-stores.md) explains clients built from stores.
- [Persist panel layout](../../../react/v0/guides/preferences.md) feeds a preference into the React panel hooks.
- [`createPreferenceStore` reference](../reference/functions/createPreferenceStore.md) lists the signature.
