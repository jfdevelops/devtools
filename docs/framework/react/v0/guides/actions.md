---
title: Call actions from React
description: Pass an action adapter to the provider, call actions from components, and disable controls that are unavailable.
order: 50
---

Actions are typed commands your inspector sends back to your library. This guide shows how to pass an adapter to the provider and call its actions from components.

It uses `requestActions` and `RequestActions` from [Add typed actions](../../../javascript/v0/guides/actions.md). A contract maps action names to function types, and an adapter supplies an `execute` function, and optionally `available`, for each name. The guide also uses the `requestClient` from [Connect an existing store](../../../javascript/v0/guides/external-stores.md#create-a-client). Actions work with the provider and the headless primitives. They do not work inside `DevtoolsStandalone`; see [What the preset does not support](./standalone-panel.md#what-the-preset-does-not-support).

In this guide you will:

- Pass the adapter to the provider.
- Call actions from a component.
- Re-render when availability changes.

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

Create the adapter once, at module scope or with `useMemo`. The provider remembers its action client by the identity of the `actions` object, so an object literal written in JSX is replaced on every render.

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

`execute` checks the arguments against the contract and returns a promise of the function's awaited result. It is always asynchronous, even when your `execute` function is synchronous. The `catch` tells `UnavailableActionError` from the error your own function threw, as the [error table](../../../javascript/v0/guides/actions.md#tell-unavailable-from-failed) explains.

`useDevtoolsActions<RequestActions>()` is an assertion, not a check. Nothing ties the generic to the adapter you gave the provider, so a wrong contract compiles and fails at run time. Wrap the hook once in your devtools package, as [TypeScript](../typescript.md#wrap-the-context-hooks-in-typed-hooks) shows. The hook throws `` `useDevtoolsActions` needs a `<DevtoolsProvider>`. `` when there is no provider above it.

## Re-render when availability changes

The kit does not watch `available`, so a component that calls `isAvailable` only updates when it renders again. See [Keep controls in step with availability](../../../javascript/v0/guides/actions.md#keep-controls-in-step-with-availability) for how to trigger that.

## Without an adapter, every action is unavailable

A `DevtoolsProvider` with no `actions` prop gives every action an unavailable state. Without any provider, `useDevtoolsActions` throws instead. If a control is always disabled, check that the provider that wraps it received the adapter. `DevtoolsStandalone` never receives one, as [What the preset does not support](./standalone-panel.md#what-the-preset-does-not-support) explains.

## Next steps

- [Inspect an existing store in React](./external-stores.md) provides the snapshots your actions act on.
- [Build a custom panel](./headless-panel.md) lays out the inspector.
- [Troubleshooting](./troubleshooting.md) lists action errors and their causes.
- [Add typed actions](../../../javascript/v0/guides/actions.md) covers the contract, the adapter and the error table.
