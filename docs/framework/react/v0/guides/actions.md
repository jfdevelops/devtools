---
title: Add typed actions
description: Let an inspector send typed commands back to your library, check whether they are available, and handle their failures.
order: 60
---

Snapshots flow from your library to the inspector. Actions flow the other way: commands such as "retry this request" or "jump to this step". The kit keeps the two paths separate. This guide shows how to define actions, pass them to the inspector and handle their errors.

In this guide you will:

- Describe your actions as a typed contract.
- Implement them in an adapter.
- Call them from React and disable controls that are unavailable.
- Tell an unavailable action apart from a failed one.

The examples use the `requestClient` from [Connect an existing store](./external-stores.md). Actions work with the provider and the headless primitives. They do not work inside `DevtoolsStandalone`; see [What the preset does not support](./standalone-panel.md#what-the-preset-does-not-support).

## Describe the contract

An action contract is a TypeScript type that maps action names to function types. The function types are exactly what the inspector will call.

```ts
// src/request-actions.ts
import type { ActionAdapter } from '@jfdevelops/devtools-kit';

export type RequestActions = {
  retry: (id: string) => Promise<boolean>;
};

let paused = false;

export function setPaused(value: boolean) {
  paused = value;
}

export const requestActions: ActionAdapter<RequestActions> = {
  retry: {
    execute: async (id) => {
      const response = await fetch(`/api/requests/${id}/retry`, {
        method: 'POST',
      });

      return response.ok;
    },
    available: () => !paused,
  },
};
```

The adapter has one entry per action you support. Each entry has an `execute` function with the contract's signature, and an optional `available` function. When you omit `available`, the action is always available. When an action's key is missing from the adapter, that action is unavailable.

Create the adapter once, at module scope or with `useMemo`. The provider remembers its action client by the identity of the `actions` object, so an object literal written in JSX is replaced on every render.

## Pass the adapter to the provider

```tsx
// src/request-actions-provider.tsx
import { DevtoolsProvider } from '@jfdevelops/devtools-kit-react/headless';
import type { ReactNode } from 'react';
import { requestClient } from './request-client';
import { requestActions } from './request-actions';

export function RequestDevtoolsProvider({ children }: { children: ReactNode }) {
  return (
    <DevtoolsProvider client={requestClient} actions={requestActions}>
      {children}
    </DevtoolsProvider>
  );
}
```

## Call actions from the UI

`useDevtoolsActions` returns an action client with two methods: `isAvailable(name)` and `execute(name, ...args)`. The generic names your contract.

```tsx
// src/retry-button.tsx
import { useState } from 'react';
import {
  UnavailableActionError,
  useDevtoolsActions,
} from '@jfdevelops/devtools-kit-react/headless';
import type { RequestActions } from './request-actions';

export function RetryButton({ id }: { id: string }) {
  const actions = useDevtoolsActions<RequestActions>();
  const [message, setMessage] = useState('');

  async function retry() {
    try {
      const succeeded = await actions.execute('retry', id);

      setMessage(succeeded ? 'Retried' : 'The retry was rejected');
    } catch (error) {
      setMessage(
        error instanceof UnavailableActionError
          ? 'Retry is not available right now'
          : `Retry failed: ${String(error)}`,
      );
    }
  }

  return (
    <>
      <button disabled={!actions.isAvailable('retry')} onClick={retry}>
        Retry
      </button>
      {message}
    </>
  );
}
```

`execute` checks the arguments against the contract and returns a promise of the function's awaited result. It is always asynchronous, even when your `execute` function is synchronous.

`useDevtoolsActions<RequestActions>()` is an assertion, not a check. Nothing ties the generic to the adapter you gave the provider, so a wrong contract compiles and fails at run time. Wrap the hook once in your devtools package, as [TypeScript](../typescript.md#wrap-the-context-hooks-in-typed-hooks) shows. The hook throws `` `useDevtoolsActions` needs a `<DevtoolsProvider>`. `` when there is no provider above it.

## Tell unavailable from failed

`execute` rejects in two different ways.

| Rejection | Meaning |
| --- | --- |
| `UnavailableActionError` | The action is missing from the adapter, or its `available` function returned `false`. Its `action` property holds the name, and its message is `Devtools action "retry" is unavailable.` |
| The original error | The action ran and failed. A synchronous throw and a rejected promise both arrive as the error your code produced. |

That separation lets your UI show "not available" differently from "it broke". The kit does not catch domain errors for you, so always handle both.

## Keep controls in step with availability

The kit reads `available` each time you call `isAvailable` or `execute`. It does not watch for the answer to change. If availability depends on state, such as `paused` above, make sure the component re-renders when that state changes. The usual way is to notify through your store's `subscribe`, so the view model changes and the inspector renders again.

## Use actions outside React

`createActionClient` builds the same client from an adapter, without React.

```ts
// src/run-retry.ts
import { createActionClient } from '@jfdevelops/devtools-kit';
import { requestActions } from './request-actions';

const actions = createActionClient(requestActions);

export async function retryFirstRequest() {
  if (actions.isAvailable('retry')) {
    return await actions.execute('retry', 'request-1');
  }

  return false;
}
```

## Without an adapter, every action is unavailable

A `DevtoolsProvider` with no `actions` prop gives every action an unavailable state. Without any provider, `useDevtoolsActions` throws instead. If a control is always disabled, check that the provider that wraps it received the adapter. `DevtoolsStandalone` never receives one, as [What the preset does not support](./standalone-panel.md#what-the-preset-does-not-support) explains.

## Next steps

- [Connect an existing store](./external-stores.md) provides the snapshots your actions act on.
- [Build a custom panel](./headless-panel.md) lays out the inspector.
- [Troubleshooting](./troubleshooting.md) lists action errors and their causes.
- [`createActionClient` reference](../reference/functions/createActionClient.md) and [`UnavailableActionError` reference](../reference/classes/UnavailableActionError.md) list the signatures.
