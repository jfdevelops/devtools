import type { StandardSchemaV1 } from '@standard-schema/spec';
import { getDevtoolsChannel, IS_DEV, type DevtoolsChannel } from './channel';
import { Devtools } from './devtools';

/** Map of collection name → the Standard Schema for entities in it. */
export type EntitySchemas = Record<string, StandardSchemaV1>;

/** The snapshot shape a client's `reduce` receives, inferred from the schemas. */
export interface DevtoolsSnapshotOf<
  E extends EntitySchemas,
  Ev extends StandardSchemaV1,
> {
  entities: {
    [K in keyof E]: ReadonlyArray<StandardSchemaV1.InferOutput<E[K]>>;
  };
  events: ReadonlyArray<StandardSchemaV1.InferOutput<Ev>>;
}

export interface CreateClientOptions {
  maxEvents?: number;
  channel?: DevtoolsChannel | undefined;
}

export interface CreateDevtoolsOptions<
  E extends EntitySchemas,
  Ev extends StandardSchemaV1,
> {
  /** Unique global key, e.g. `'__MY_LIBRARY_DEVTOOLS__'`. */
  key: string;
  /** Schema per entity collection. `{}` if the library only tracks events. */
  entities: E;
  /** Schema for the event stream (typically a discriminated union). */
  events?: Ev;
  /**
   * Validate `putEntity` / `emit` payloads against the schemas in development
   * and `console.warn` on failure. Off by default; async schemas are skipped.
   */
  validate?: boolean;
}

/**
 * The typed surface a library builds its devtools on. Everything is inferred
 * from `entities` / `events` — no explicit type arguments. The `put*` / `emit`
 * half is called from library internals; `createClient` produces the
 * {@link Devtools} instance the UI consumes. All no-ops in production.
 */
export interface DevtoolsApi<
  E extends EntitySchemas,
  Ev extends StandardSchemaV1,
> {
  putEntity<K extends keyof E & string>(
    collection: K,
    id: string,
    data: StandardSchemaV1.InferOutput<E[K]>,
  ): void;
  removeEntity(collection: keyof E & string, id: string): void;
  emit(event: StandardSchemaV1.InferOutput<Ev>): void;

  /** Monotonic id, unique within the process. */
  nextId(prefix: string): string;
  /** Stable string id for a `symbol` identity token. */
  ownerId(token: symbol): string;

  createClient<VM>(
    reduce: (snapshot: DevtoolsSnapshotOf<E, Ev>) => VM,
    options?: CreateClientOptions,
  ): Devtools<VM>;
}

/**
 * Creates a {@link DevtoolsApi} from a Standard Schema description of the data
 * a library exposes. Types flow from the argument, so callers never write
 * generics:
 *
 * ```ts
 * import { z } from 'zod';
 * import { createDevtools } from '@jfdevelops/devtools-kit';
 *
 * export const devtools = createDevtools({
 *   key: '__MY_LIBRARY_DEVTOOLS__',
 *   entities: {
 *     widget: z.object({ id: z.string(), label: z.string() }),
 *   },
 *   events: z.discriminatedUnion('type', [
 *     z.object({ type: z.literal('widget:tick'), at: z.number() }),
 *   ]),
 * });
 *
 * devtools.putEntity('widget', w.id, w); // data: { id: string; label: string }
 * ```
 */
export function createDevtools<
  const E extends EntitySchemas,
  Ev extends StandardSchemaV1 = StandardSchemaV1<unknown, unknown>,
>(options: CreateDevtoolsOptions<E, Ev>): DevtoolsApi<E, Ev> {
  const { key, entities, events, validate = false } = options;
  let counter = 0;
  const ownerIds = new Map<symbol, string>();

  const safely = (run: () => void): void => {
    try {
      run();
    } catch {
      // A devtools failure must never surface in the host app.
    }
  };

  const checkSchema = (
    schema: StandardSchemaV1 | undefined,
    label: string,
    value: unknown,
  ): void => {
    if (!validate || !schema) {
      return;
    }
    safely(() => {
      const result = schema['~standard'].validate(value);
      if (result instanceof Promise) {
        console.warn(`[devtools-kit] async schema for ${label} was skipped`);
        return;
      }
      if (result.issues) {
        console.warn(
          `[devtools-kit] ${label} failed schema validation`,
          result.issues,
          value,
        );
      }
    });
  };

  const reduceCast = <VM>(
    reduce: (snapshot: DevtoolsSnapshotOf<E, Ev>) => VM,
  ) =>
    reduce as unknown as (snapshot: {
      entities: Record<string, ReadonlyArray<unknown>>;
      events: ReadonlyArray<unknown>;
    }) => VM;

  return {
    putEntity(collection, id, data) {
      if (!IS_DEV) return;
      checkSchema(entities[collection], `entity "${collection}"`, data);
      safely(() => getDevtoolsChannel(key)?.putEntity(collection, id, data));
    },
    removeEntity(collection, id) {
      if (!IS_DEV) return;
      safely(() => getDevtoolsChannel(key)?.removeEntity(collection, id));
    },
    emit(event) {
      if (!IS_DEV) return;
      checkSchema(events, 'event', event);
      safely(() => getDevtoolsChannel(key)?.emit(event));
    },
    nextId(prefix) {
      counter += 1;
      return `${prefix}-${counter}`;
    },
    ownerId(token) {
      let existing = ownerIds.get(token);
      if (!existing) {
        counter += 1;
        existing = `owner-${counter}`;
        ownerIds.set(token, existing);
      }
      return existing;
    },
    createClient(reduce, clientOptions = {}) {
      // Only forward `channel` when supplied — `channel: undefined` would
      // suppress the global-channel lookup.
      return new Devtools(
        'channel' in clientOptions
          ? {
              channelKey: key,
              reduce: reduceCast(reduce),
              channel: clientOptions.channel,
              maxEvents: clientOptions.maxEvents,
            }
          : {
              channelKey: key,
              reduce: reduceCast(reduce),
              maxEvents: clientOptions.maxEvents,
            },
      );
    },
  };
}
