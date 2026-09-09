/**
 * The dev-only channel: a small in-memory store of typed entity collections plus
 * a bounded event stream, installed once on `globalThis` under a caller-chosen
 * key. Libraries write to it at instrumentation points; a {@link Devtools}
 * client reads from it. Nothing here runs in production — {@link IS_DEV} folds
 * to `false` and every guarded call site (and this module) is dead-code
 * eliminated.
 */

/**
 * True in every build except a production one. Bundlers replace
 * `process.env.NODE_ENV` textually; the `typeof process` guard keeps a
 * non-bundled browser ESM load from throwing.
 */
export const IS_DEV: boolean =
  typeof process === 'undefined' ||
  process.env == null ||
  process.env.NODE_ENV !== 'production';

export const DEVTOOLS_CHANNEL_VERSION = 1 as const;

const DEFAULT_MAX_EVENTS = 200;

/** Immutable view of the channel. Stable reference until the next change. */
export interface DevtoolsChannelSnapshot {
  entities: Record<string, ReadonlyArray<unknown>>;
  events: ReadonlyArray<unknown>;
}

export interface DevtoolsChannel {
  readonly version: typeof DEVTOOLS_CHANNEL_VERSION;

  /** Insert or replace an entity in a collection. */
  putEntity(collection: string, id: string, data: unknown): void;
  /** Remove an entity from a collection. */
  removeEntity(collection: string, id: string): void;
  /** Append a transient event. */
  emit(event: unknown): void;

  getSnapshot(): DevtoolsChannelSnapshot;
  subscribe(listener: () => void): () => void;

  /** Retained-event cap (ring buffer). */
  maxEvents: number;
}

function createChannel(): DevtoolsChannel {
  const collections = new Map<string, Map<string, unknown>>();
  let events: unknown[] = [];
  const listeners = new Set<() => void>();

  let snapshot: DevtoolsChannelSnapshot = { entities: {}, events: [] };
  let scheduled = false;

  function rebuild() {
    const entities: Record<string, ReadonlyArray<unknown>> = {};
    for (const [name, map] of collections) {
      entities[name] = [...map.values()];
    }
    snapshot = { entities, events: [...events] };
  }

  function notify() {
    rebuild();
    if (scheduled) {
      return;
    }
    scheduled = true;
    queueMicrotask(() => {
      scheduled = false;
      for (const listener of listeners) {
        listener();
      }
    });
  }

  const channel: DevtoolsChannel = {
    version: DEVTOOLS_CHANNEL_VERSION,
    maxEvents: DEFAULT_MAX_EVENTS,

    putEntity(collection, id, data) {
      let map = collections.get(collection);
      if (!map) {
        map = new Map();
        collections.set(collection, map);
      }
      map.set(id, data);
      notify();
    },
    removeEntity(collection, id) {
      collections.get(collection)?.delete(id);
      notify();
    },
    emit(event) {
      events.push(event);
      if (events.length > channel.maxEvents) {
        events = events.slice(-channel.maxEvents);
      }
      notify();
    },

    getSnapshot() {
      return snapshot;
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };

  rebuild();
  return channel;
}

/**
 * Returns the channel for `key`, creating and installing it on `globalThis` on
 * the first call. Returns `undefined` in production so callers compile away.
 */
export function getDevtoolsChannel(key: string): DevtoolsChannel | undefined {
  if (!IS_DEV) {
    return undefined;
  }
  const scope = globalThis as Record<string, unknown>;
  let channel = scope[key] as DevtoolsChannel | undefined;
  if (!channel) {
    channel = createChannel();
    scope[key] = channel;
  }
  return channel;
}
