---
title: Add typed actions
description: Let an inspector send typed commands back to your library, check whether they are available, and handle their failures.
order: 40
---

Snapshots flow from your library to the inspector. Actions flow the other way: commands such as "retry this request" or "jump to this step". The kit keeps the two paths separate. This guide shows how to define actions, call them and handle their errors.

In this guide you will:

- Describe your actions as a typed contract.
- Implement them in an adapter.
- Call them and tell an unavailable action apart from a failed one.
- Keep controls in step with availability.

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

Create the adapter once, at module scope. A UI framework that remembers the action client by the identity of the adapter replaces it whenever you pass a new object.

## Call an action

`createActionClient` builds an action client from the adapter. It has two methods: `isAvailable(name)` and `execute(name, ...args)`. `execute` checks the arguments against the contract and returns a promise of the function's awaited result.

```ts
// src/retry.ts
import {
  createActionClient,
  UnavailableActionError,
} from '@jfdevelops/devtools-kit';
import { requestActions } from './request-actions';

const actions = createActionClient(requestActions);

export async function retryRequest(id: string) {
  if (!actions.isAvailable('retry')) {
    return 'Retry is not available right now';
  }

  try {
    const succeeded = await actions.execute('retry', id);

    return succeeded ? 'Retried' : 'The retry was rejected';
  } catch (error) {
    return error instanceof UnavailableActionError
      ? 'Retry is not available right now'
      : `Retry failed: ${String(error)}`;
  }
}
```

`execute` is always asynchronous, even when your `execute` function is synchronous. The `isAvailable` check before the call lets a control disable itself. Here nothing runs between the check and the call, so the `catch` handles the error your own function threw. The `UnavailableActionError` branch matters when the check and the call are separated in time, for example when a button is clicked later.

## Tell unavailable from failed

`execute` rejects in two different ways.

| Rejection | Meaning |
| --- | --- |
| `UnavailableActionError` | The action is missing from the adapter, or its `available` function returned `false`. Its `action` property holds the name, and its message is `Devtools action "retry" is unavailable.` |
| The original error | The action ran and failed. A synchronous throw and a rejected promise both arrive as the error your code produced. |

That separation lets your UI show "not available" differently from "it broke". The kit does not catch domain errors for you, so always handle both.

## Keep controls in step with availability

The kit reads `available` each time you call `isAvailable` or `execute`. It does not watch for the answer to change. If availability depends on state, such as `paused` above, make sure your UI renders again when that state changes. The usual way is to notify through your store's `subscribe`, so the view model changes and the inspector renders again.

## Next steps

- [Connect an existing store](./external-stores.md) provides the snapshots your actions act on.
- [Troubleshooting](./troubleshooting.md) lists action errors and their causes.
- [Call actions from React](../../../react/v0/guides/actions.md) passes the adapter to a provider and calls it from components.
- [`createActionClient` reference](../reference/functions/createActionClient.md) and [`UnavailableActionError` reference](../reference/classes/UnavailableActionError.md) list the signatures.
