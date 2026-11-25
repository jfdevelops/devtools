---
title: Test a React inspector
description: Test subscription-driven React UI with microtask waits, and test an inspector against a store you control, with no producer.
order: 110
---

An inspector reads a client, and a client notifies after a microtask. This guide shows how to test React UI that depends on that, and how to test an inspector without the library that feeds it.

The examples use Vitest and Testing Library. [Isolate tests that share a key](../../../javascript/v0/guides/testing.md#isolate-tests-that-share-a-key) covers keeping channels apart between tests.

In this guide you will:

- Wait for subscription-driven UI.
- Test an inspector with no producer.

## Wait for subscription-driven UI

Subscribers hear about changes after a microtask. After a write, let that microtask run before you assert on UI that depends on it.

```tsx
// src/panel.test.tsx
import { act, render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { DevtoolsPanel } from '@jfdevelops/devtools-kit-react';
import { client } from './client';
import { stepsTab } from './tabs';
import { enterStep } from './wizard';

it('shows a step after it is entered', async () => {
  render(<DevtoolsPanel devtools={client} tabs={[stepsTab]} />);

  act(() => {
    enterStep({ id: 'account', title: 'Account' });
  });
  await act(async () => {
    await Promise.resolve();
  });

  expect(screen.getByText('Account, visits: 1')).toBeDefined();
});
```

`getViewModel` and `getSnapshot` do not wait. Only the subscription callback is delayed, so tests that read values directly need no extra step.

## Test an inspector with no producer

An inspector only needs a client. You can test it without the library that feeds it.

For an inspector built on an external store, hand the client a store you control. Notifications from an external store are whatever your source does, so a synchronous store needs no wait.

```tsx
// src/store-inspector.test.tsx
import { act, render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import {
  createExternalStoreClient,
  DevtoolsProvider,
  useDevtoolsViewModel,
} from '@jfdevelops/devtools-kit-react/headless';

it('re-renders when the source changes', () => {
  const listeners = new Set<() => void>();
  let snapshot = { count: 0 };
  const store = {
    subscribe(listener: () => void) {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot: () => snapshot,
  };

  function Count() {
    return <span>{useDevtoolsViewModel<{ count: number }>().count}</span>;
  }

  render(
    <DevtoolsProvider client={createExternalStoreClient(store)}>
      <Count />
    </DevtoolsProvider>,
  );

  act(() => {
    snapshot = { count: 1 };
    listeners.forEach((listener) => listener());
  });

  expect(screen.getByText('1')).toBeDefined();
});
```

## Next steps

- [Read the view model in React](./view-models.md) covers reading a client in components.
- [Inspect an existing store in React](./external-stores.md) covers inspectors built on a store.
- [Test instrumentation and clients](../../../javascript/v0/guides/testing.md) covers instrumentation, reducers and validation warnings.
