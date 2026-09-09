import { afterEach, describe, expect, it, vi } from 'vitest';
import { getDevtoolsChannel } from '../src';

const KEY = '__DEVTOOLS_KIT_TEST_CHANNEL__';

afterEach(() => {
  delete (globalThis as Record<string, unknown>)[KEY];
});

describe('getDevtoolsChannel', () => {
  it('installs a channel on globalThis and is idempotent', () => {
    const channel = getDevtoolsChannel(KEY);
    expect(channel).toBeDefined();
    expect(getDevtoolsChannel(KEY)).toBe(channel);
    expect((globalThis as Record<string, unknown>)[KEY]).toBe(channel);
  });

  it('tracks entity collections in the snapshot', () => {
    const channel = getDevtoolsChannel(KEY)!;
    channel.putEntity('widget', 'w1', { id: 'w1', label: 'A' });
    channel.putEntity('widget', 'w2', { id: 'w2', label: 'B' });
    channel.putEntity('gadget', 'g1', { id: 'g1' });

    expect(channel.getSnapshot().entities.widget).toHaveLength(2);
    expect(channel.getSnapshot().entities.gadget).toHaveLength(1);

    channel.removeEntity('widget', 'w1');
    expect(channel.getSnapshot().entities.widget).toHaveLength(1);
  });

  it('caps events with a ring buffer', () => {
    const channel = getDevtoolsChannel(KEY)!;
    channel.maxEvents = 3;
    for (let i = 0; i < 10; i += 1) {
      channel.emit({ type: 'tick', n: i });
    }
    const events = channel.getSnapshot().events as Array<{ n: number }>;
    expect(events).toHaveLength(3);
    expect(events.map((e) => e.n)).toEqual([7, 8, 9]);
  });

  it('notifies subscribers on the microtask after a change', async () => {
    const channel = getDevtoolsChannel(KEY)!;
    const listener = vi.fn();
    const unsubscribe = channel.subscribe(listener);

    channel.emit({ type: 'a' });
    channel.emit({ type: 'b' });
    expect(listener).not.toHaveBeenCalled();
    await Promise.resolve();
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    channel.emit({ type: 'c' });
    await Promise.resolve();
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('returns a stable snapshot reference until the next change', () => {
    const channel = getDevtoolsChannel(KEY)!;
    const first = channel.getSnapshot();
    expect(channel.getSnapshot()).toBe(first);
    channel.emit({ type: 'x' });
    expect(channel.getSnapshot()).not.toBe(first);
  });
});
