import { describe, expect, it, vi } from 'vitest';
import { createActionClient, createExternalStoreClient, createPreferenceStore, UnavailableActionError } from '../src';

 describe('external sources and commands', () => {
  it('caches projections and borrows subscription lifetimes independently', () => {
    let snapshot = { count: 1 };
    const listeners = new Set<() => void>();
    const source = { getSnapshot: () => snapshot, getServerSnapshot: () => ({ count: 0 }), subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; } };
    const select = vi.fn((value: { count: number }) => [value.count]);
    const first = createExternalStoreClient(source, select);
    const second = createExternalStoreClient(source);
    expect(listeners.size).toBe(0);
    expect(first.getViewModel()).toBe(first.getViewModel());
    expect(select).toHaveBeenCalledTimes(1);
    const unsubscribe = first.subscribe(() => {});
    const unsubscribeSecond = second.subscribe(() => {});
    unsubscribe();
    expect(listeners.size).toBe(1);
    snapshot = { count: 2 };
    expect(first.getViewModel()).toEqual([2]);
    unsubscribeSecond();
    expect(listeners.size).toBe(0);
  });

  it('preserves arguments, async results, failures, and dynamic capabilities', async () => {
    let enabled = false;
    const failure = new Error('domain failure');
    const client = createActionClient<{ save: (id: string, count: number) => Promise<string>; fail: () => void; missing: () => void }>({
      save: { execute: async (id, count) => `${id}:${count}`, available: () => enabled },
      fail: { execute() { throw failure; } },
    });
    expect(client.isAvailable('save')).toBe(false);
    await expect(client.execute('save', 'a', 2)).rejects.toBeInstanceOf(UnavailableActionError);
    enabled = true;
    await expect(client.execute('save', 'a', 2)).resolves.toBe('a:2');
    await expect(client.execute('fail')).rejects.toBe(failure);
    await expect(client.execute('missing')).rejects.toBeInstanceOf(UnavailableActionError);
    if (false) {
      // @ts-expect-error arguments retain their declared types
      client.execute('save', 2);
    }
  });

  it('only reads and writes explicitly selected preferences', () => {
    const storage = { getItem: vi.fn(() => '2'), setItem: vi.fn(), removeItem: vi.fn() };
    const store = createPreferenceStore({ storage, key: 'size-v1', defaultValue: 1, parse: Number, serialize: String });
    expect(storage.getItem).not.toHaveBeenCalled();
    store.refresh();
    expect(store.getSnapshot()).toBe(2);
    expect(store.getServerSnapshot?.()).toBe(1);
    store.set(3);
    expect(storage.setItem).toHaveBeenCalledWith('size-v1', '3');
    store.reset();
    expect(store.getSnapshot()).toBe(1);
  });
});
