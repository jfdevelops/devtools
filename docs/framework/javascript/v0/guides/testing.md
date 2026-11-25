---
title: Test instrumentation and clients
description: Test instrumentation and clients in isolation, with unique channel keys, microtask waits, inert clients and injected channels.
order: 70
---

The kit's state lives on `globalThis` and its notifications arrive after a microtask. Both facts affect how you write tests. This guide shows how to test your instrumentation and your clients without one test leaking into the next.

The examples use Vitest. The ideas apply to any test runner.

In this guide you will:

- Read what your library recorded.
- Isolate tests that share a channel key.
- Wait for notifications.
- Test a reducer against a fixed channel.
- Check validation warnings.

## The environment in tests

Test runners normally set `NODE_ENV` to `test`, so `IS_DEV` is `true` and instrumentation records. You do not need to enable anything.

## Read what your library recorded

`getDevtoolsChannel(key)` returns the channel for a key, so a test can read its snapshot. It installs a channel if none exists yet.

```ts
// src/instrumentation.test.ts
import { afterEach, expect, it } from 'vitest';
import { getDevtoolsChannel } from '@jfdevelops/devtools-kit';
import { enterStep } from './wizard';

const key = '__WIZARD_DEVTOOLS__';

afterEach(() => {
  Reflect.deleteProperty(globalThis, key);
});

it('records the step and an event', () => {
  enterStep({ id: 'account', title: 'Account' });

  const snapshot = getDevtoolsChannel(key)?.getSnapshot();

  expect(snapshot?.entities.step).toEqual([
    { id: 'account', title: 'Account', visits: 1 },
  ]);
  expect(snapshot?.events).toHaveLength(1);
});
```

The snapshot is current as soon as the write returns. Only notifications to subscribers are delayed.

## Isolate tests that share a key

Tests in the same file share `globalThis`, and so do separate files if your runner does not isolate them. A channel installed by one test is still there for the next. Use one of these two approaches.

- Delete the global after each test, as the example does. `createDevtools` looks the channel up on every write, so the next write installs a fresh one.
- Give each test its own key, built with a counter, so channels never collide.

A client resolves its channel once, when you create it. If you delete the global, a client created earlier keeps reading the old channel. Create clients inside the test, or delete the global only in files whose clients are created per test.

## Wait for notifications

Subscribers hear about changes after a microtask, and several writes in the same tick produce one call. After a write, let that microtask run before you assert that a listener ran.

```ts
// src/notifications.test.ts
import { afterEach, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { createDevtools } from '@jfdevelops/devtools-kit';

const key = '__WIZARD_NOTIFICATIONS_TEST__';

afterEach(() => {
  Reflect.deleteProperty(globalThis, key);
});

it('notifies a subscriber once for several writes', async () => {
  const api = createDevtools({
    key,
    entities: { step: z.object({ id: z.string() }) },
  });
  const client = api.createClient((snapshot) => snapshot.entities.step.length);
  const listener = vi.fn();
  const unsubscribe = client.subscribe(listener);

  api.putEntity('step', 'account', { id: 'account' });
  api.putEntity('step', 'billing', { id: 'billing' });

  expect(client.getViewModel()).toBe(2);
  expect(listener).not.toHaveBeenCalled();

  await Promise.resolve();

  expect(listener).toHaveBeenCalledTimes(1);

  unsubscribe();
});
```

`getViewModel` and `getSnapshot` do not wait: the view model already reflects both writes before the listener runs. Only the subscription callback is delayed, so tests that read values directly need no extra step.

## Test a reducer with a fixed channel

To test a reducer against exact data, pass a channel you wrote. The `channel` option replaces the global lookup, so nothing touches `globalThis`.

```ts
// src/reducer.test.ts
import { expect, it } from 'vitest';
import {
  DEVTOOLS_CHANNEL_VERSION,
  type DevtoolsChannel,
  type DevtoolsChannelSnapshot,
} from '@jfdevelops/devtools-kit';
import { devtools } from './devtools';

it('reduces a fixed snapshot', () => {
  const snapshot: DevtoolsChannelSnapshot = {
    entities: { step: [{ id: 'account', title: 'Account', visits: 2 }] },
    events: [],
  };
  const channel: DevtoolsChannel = {
    version: DEVTOOLS_CHANNEL_VERSION,
    maxEvents: 200,
    putEntity() {},
    removeEntity() {},
    emit() {},
    getSnapshot: () => snapshot,
    subscribe: () => () => {},
  };

  const client = devtools.createClient((current) => current.entities.step, {
    channel,
  });

  expect(client.getViewModel()).toEqual([
    { id: 'account', title: 'Account', visits: 2 },
  ]);
});
```

Passing `channel: undefined` is different: the key being present at all skips the global lookup, so you get an inert client. Its `isActive` is `false`, and `getViewModel` returns your reducer's result for empty data.

```ts
// src/inert.test.ts
import { expect, it } from 'vitest';
import { devtools } from './devtools';

it('is inert without a channel', () => {
  const client = devtools.createClient((snapshot) => snapshot.entities.step, {
    channel: undefined,
  });

  expect(client.isActive).toBe(false);
  expect(client.getViewModel()).toEqual([]);
});
```

If you build a client from the `Devtools` class directly, the options are `channelKey`, `reduce`, and optionally `channel`, `maxEvents` and `enabled`.

## Test validation warnings

With `validate: true`, a failing payload calls `console.warn`. Spy on it.

```ts
// src/validation.test.ts
import { afterEach, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { createDevtools } from '@jfdevelops/devtools-kit';

const key = '__WIZARD_VALIDATION_TEST__';

afterEach(() => {
  Reflect.deleteProperty(globalThis, key);
  vi.restoreAllMocks();
});

it('warns about an invalid entity', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const api = createDevtools({
    key,
    entities: { step: z.object({ id: z.string().min(1) }) },
    validate: true,
  });

  api.putEntity('step', '', { id: '' });

  expect(warn).toHaveBeenCalledWith(
    expect.stringContaining('entity "step" failed schema validation'),
    expect.anything(),
    expect.anything(),
  );
});
```

## Next steps

- [Derive a view model](./view-models.md) covers clients.
- [Instrument a library](./instrument-a-library.md) covers validation.
- [Test a React inspector](../../../react/v0/guides/testing.md) covers subscription-driven UI and inspectors with no producer.
- [`getDevtoolsChannel` reference](../reference/functions/getDevtoolsChannel.md) lists the signature.
