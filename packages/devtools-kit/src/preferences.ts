import type { ExternalStore } from './client';

export interface PreferenceStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/** Explicit preference schema/serialization; never persists source or session data. */
export function createPreferenceStore<Value>(options: {
  storage: PreferenceStorage;
  key: string;
  defaultValue: Value;
  parse: (serialized: string) => Value;
  serialize: (value: Value) => string;
}) {
  const listeners = new Set<() => void>();
  let value = options.defaultValue;
  function notify() { for (const listener of listeners) listener(); }
  function refresh() {
    const serialized = options.storage.getItem(options.key);
    const next = serialized === null ? options.defaultValue : options.parse(serialized);
    if (!Object.is(value, next)) { value = next; notify(); }
  }
  // Initialization is explicit so construction and server rendering do not read storage.
  const store: ExternalStore<Value> & { refresh: typeof refresh; set(value: Value): void; reset(): void } = {
    getSnapshot: () => value,
    getServerSnapshot: () => options.defaultValue,
    subscribe(listener) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    refresh,
    set(next) {
      options.storage.setItem(options.key, options.serialize(next));
      if (!Object.is(value, next)) { value = next; notify(); }
    },
    reset() { options.storage.removeItem(options.key); value = options.defaultValue; notify(); },
  };
  return store;
}
