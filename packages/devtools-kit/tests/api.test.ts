import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vitest';
import { z } from 'zod';
import { createDevtools, Devtools, getDevtoolsChannel } from '../src';

const KEY = '__DEVTOOLS_KIT_TEST_API__';

afterEach(() => {
  delete (globalThis as Record<string, unknown>)[KEY];
  vi.restoreAllMocks();
});

const widgetSchema = z.object({ id: z.string(), label: z.string() });
const eventSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('widget:tick'), at: z.number() }),
  z.object({ type: z.literal('widget:error'), at: z.number(), message: z.string() }),
]);

type Widget = z.infer<typeof widgetSchema>;
type WidgetEvent = z.infer<typeof eventSchema>;

function makeApi(validate = false) {
  return createDevtools({
    key: KEY,
    entities: { widget: widgetSchema },
    events: eventSchema,
    validate,
  });
}

describe('createDevtools', () => {
  it('infers entity and event types from the schemas, no explicit generics', () => {
    const api = makeApi();
    expectTypeOf(api.putEntity).parameter(0).toEqualTypeOf<'widget'>();
    expectTypeOf(api.putEntity).parameter(2).toEqualTypeOf<Widget>();
    expectTypeOf(api.emit).parameter(0).toEqualTypeOf<WidgetEvent>();

    api.createClient((snapshot) => {
      expectTypeOf(snapshot.entities.widget).toEqualTypeOf<
        ReadonlyArray<Widget>
      >();
      expectTypeOf(snapshot.events).toEqualTypeOf<ReadonlyArray<WidgetEvent>>();
      return snapshot.entities.widget.length;
    });
  });

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
    const client = api.createClient((snapshot) => ({
      widgets: snapshot.entities.widget ?? [],
      ticks: snapshot.events.filter((e) => e.type === 'widget:tick').length,
    }));
    expect(client).toBeInstanceOf(Devtools);
    expect(client.isActive).toBe(true);

    const first = client.getViewModel();
    expect(client.getViewModel()).toBe(first);

    api.putEntity('widget', 'w1', { id: 'w1', label: 'A' });
    api.emit({ type: 'widget:tick', at: 1 });
    await Promise.resolve();

    const next = client.getViewModel();
    expect(next).not.toBe(first);
    expect(next.widgets).toHaveLength(1);
    expect(next.ticks).toBe(1);
  });

  it('is inert when given an explicit undefined channel', () => {
    const api = makeApi();
    const client = api.createClient(
      (snapshot) => snapshot.entities.widget ?? [],
      { channel: undefined },
    );
    expect(client.isActive).toBe(false);
    expect(client.getViewModel()).toEqual([]);
  });

  it('warns when validate is on and a payload fails its schema', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const api = makeApi(true);

    // `label` is required by the schema.
    api.putEntity('widget', 'w1', { id: 'w1' } as never);

    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('entity "widget" failed schema validation'),
      expect.anything(),
      expect.anything(),
    );
    // The entity is still recorded — validation only warns.
    expect(getDevtoolsChannel(KEY)!.getSnapshot().entities.widget).toHaveLength(
      1,
    );
  });

  it('does not validate when validate is off', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const api = makeApi(false);
    api.putEntity('widget', 'w1', { id: 'w1' } as never);
    expect(warn).not.toHaveBeenCalled();
  });
});
