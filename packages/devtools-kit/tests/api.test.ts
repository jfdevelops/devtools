import { afterEach, describe, expect, it, vi } from 'vitest';
import { createDevtoolsChannelApi, Devtools, getDevtoolsChannel } from '../src';

const KEY = '__DEVTOOLS_KIT_TEST_API__';

afterEach(() => {
  delete (globalThis as Record<string, unknown>)[KEY];
});

type Entities = { widget: { id: string; label: string } };
type Event = { type: 'widget:tick'; at: number };

interface ViewModel {
  widgets: ReadonlyArray<{ id: string; label: string }>;
  tickCount: number;
}

function makeApi() {
  return createDevtoolsChannelApi<Entities, Event>(KEY);
}

const reduce = (snapshot: {
  entities: { widget: ReadonlyArray<{ id: string; label: string }> };
  events: ReadonlyArray<Event>;
}): ViewModel => ({
  widgets: snapshot.entities.widget ?? [],
  tickCount: snapshot.events.filter((e) => e.type === 'widget:tick').length,
});

describe('createDevtoolsChannelApi', () => {
  it('routes putEntity / emit to the shared channel', () => {
    const api = makeApi();
    api.putEntity('widget', 'w1', { id: 'w1', label: 'A' });
    api.emit({ type: 'widget:tick', at: 1 });

    const snapshot = getDevtoolsChannel(KEY)!.getSnapshot();
    expect(snapshot.entities.widget).toEqual([{ id: 'w1', label: 'A' }]);
    expect(snapshot.events).toHaveLength(1);
  });

  it('produces monotonic ids and stable owner ids', () => {
    const api = makeApi();
    expect(api.nextId('page')).toBe('page-1');
    expect(api.nextId('page')).toBe('page-2');
    const token = Symbol('owner');
    expect(api.ownerId(token)).toBe(api.ownerId(token));
  });

  it('createClient yields a working, memoised Devtools', async () => {
    const api = makeApi();
    const client = api.createClient(reduce);
    expect(client).toBeInstanceOf(Devtools);
    expect(client.isActive).toBe(true);

    const listener = vi.fn();
    client.subscribe(listener);

    const first = client.getViewModel();
    expect(client.getViewModel()).toBe(first);

    api.putEntity('widget', 'w1', { id: 'w1', label: 'A' });
    api.emit({ type: 'widget:tick', at: 1 });
    await Promise.resolve();

    expect(listener).toHaveBeenCalled();
    const next = client.getViewModel();
    expect(next).not.toBe(first);
    expect(next.widgets).toHaveLength(1);
    expect(next.tickCount).toBe(1);
  });

  it('is inert when given an explicit undefined channel', () => {
    const api = makeApi();
    const client = api.createClient(reduce, { channel: undefined });
    expect(client.isActive).toBe(false);
    expect(client.getViewModel()).toEqual({ widgets: [], tickCount: 0 });
  });
});
