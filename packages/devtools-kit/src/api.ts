import { getDevtoolsChannel, IS_DEV, type DevtoolsChannel } from './channel';
import { Devtools } from './devtools';

/** Map of collection name → the entity type stored in it. */
export type EntitySchema = Record<string, unknown>;

/** Typed view of a channel snapshot for a given schema. */
export interface TypedDevtoolsSnapshot<E extends EntitySchema, Ev> {
  entities: { [K in keyof E]: ReadonlyArray<E[K]> };
  events: ReadonlyArray<Ev>;
}

export interface CreateClientOptions {
  maxEvents?: number;
  channel?: DevtoolsChannel | undefined;
}

/**
 * The typed surface a library builds its devtools on. The `put*` / `emit` half
 * is called from library internals at instrumentation points; `createClient`
 * produces the {@link Devtools} instance the UI consumes.
 */
export interface DevtoolsChannelApi<E extends EntitySchema, Ev> {
  putEntity<K extends keyof E & string>(collection: K, id: string, data: E[K]): void;
  removeEntity(collection: keyof E & string, id: string): void;
  emit(event: Ev): void;

  /** Monotonic id, unique within the process. */
  nextId(prefix: string): string;
  /** Stable string id for a `symbol` identity token (e.g. an owner marker). */
  ownerId(token: symbol): string;

  createClient<VM>(
    reduce: (snapshot: TypedDevtoolsSnapshot<E, Ev>) => VM,
    options?: CreateClientOptions,
  ): Devtools<VM>;
}

/**
 * Creates the {@link DevtoolsChannelApi} for a library. Pick a unique
 * `channelKey` (e.g. `'__MY_LIBRARY_DEVTOOLS__'`). Everything is a no-op in
 * production and never throws.
 *
 * ```ts
 * type Entities = { widget: WidgetDescriptor };
 * type Event = { type: 'widget:tick'; at: number };
 *
 * export const devtools = createDevtoolsChannelApi<Entities, Event>(
 *   '__MY_LIBRARY_DEVTOOLS__',
 * );
 * ```
 */
export function createDevtoolsChannelApi<E extends EntitySchema, Ev>(
  channelKey: string,
): DevtoolsChannelApi<E, Ev> {
  let counter = 0;
  const ownerIds = new Map<symbol, string>();

  const safely = (run: () => void): void => {
    try {
      run();
    } catch {
      // A devtools failure must never surface in the host app.
    }
  };

  return {
    putEntity(collection, id, data) {
      if (!IS_DEV) return;
      safely(() =>
        getDevtoolsChannel(channelKey)?.putEntity(collection, id, data),
      );
    },
    removeEntity(collection, id) {
      if (!IS_DEV) return;
      safely(() => getDevtoolsChannel(channelKey)?.removeEntity(collection, id));
    },
    emit(event) {
      if (!IS_DEV) return;
      safely(() => getDevtoolsChannel(channelKey)?.emit(event));
    },
    nextId(prefix) {
      counter += 1;
      return `${prefix}-${counter}`;
    },
    ownerId(token) {
      let id = ownerIds.get(token);
      if (!id) {
        counter += 1;
        id = `owner-${counter}`;
        ownerIds.set(token, id);
      }
      return id;
    },
    createClient(reduce, options = {}) {
      const reduceUnknown = reduce as unknown as (snapshot: {
        entities: Record<string, ReadonlyArray<unknown>>;
        events: ReadonlyArray<unknown>;
      }) => ReturnType<typeof reduce>;
      // Only forward `channel` when the caller actually supplied one — passing
      // `channel: undefined` would suppress the global-channel lookup.
      return new Devtools(
        'channel' in options
          ? {
              channelKey,
              reduce: reduceUnknown,
              channel: options.channel,
              maxEvents: options.maxEvents,
            }
          : { channelKey, reduce: reduceUnknown, maxEvents: options.maxEvents },
      );
    },
  };
}
