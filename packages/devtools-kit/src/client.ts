/** A borrowed source. Clients never dispose it or subscribe until requested. */
export interface ExternalStore<Snapshot> {
  subscribe(listener: () => void): () => void;
  getSnapshot(): Snapshot;
  getServerSnapshot?(): Snapshot;
}

export interface DevtoolsClient<ViewModel> {
  subscribe(listener: () => void): () => void;
  getViewModel(): ViewModel;
  getServerViewModel?(): ViewModel;
}

/** The source must return the same snapshot reference until its data changes. */
export function createExternalStoreClient<Snapshot, ViewModel = Snapshot>(
  source: ExternalStore<Snapshot>,
  select: (snapshot: Snapshot) => ViewModel = (snapshot) => snapshot as unknown as ViewModel,
): DevtoolsClient<ViewModel> {
  function cache(read: () => Snapshot) {
    let initialized = false;
    let previous: Snapshot;
    let result: ViewModel;
    return function getViewModel() {
      const snapshot = read();
      if (!initialized || !Object.is(previous, snapshot)) {
        result = select(snapshot);
        previous = snapshot;
        initialized = true;
      }
      return result;
    };
  }
  const getViewModel = cache(() => source.getSnapshot());
  const getServerViewModel = source.getServerSnapshot
    ? cache(() => source.getServerSnapshot!())
    : getViewModel;
  return {
    subscribe: (listener) => source.subscribe(listener),
    getViewModel,
    getServerViewModel,
  };
}

export type ActionContract<Actions = Record<string, (...args: never[]) => unknown>> = {
  [Key in keyof Actions]: (...args: never[]) => unknown;
};
export type ActionAdapter<Actions extends ActionContract<Actions>> = {
  [Key in keyof Actions]?: {
    execute: Actions[Key];
    available?: () => boolean;
  };
};

export class UnavailableActionError extends Error {
  constructor(public readonly action: PropertyKey) {
    super(`Devtools action "${String(action)}" is unavailable.`);
    this.name = 'UnavailableActionError';
  }
}

export function createActionClient<Actions extends ActionContract<Actions>>(adapter: ActionAdapter<Actions>) {
  function isAvailable<Key extends keyof Actions>(name: Key) {
    const action = adapter[name];
    return !!action && (action.available?.() ?? true);
  }
  async function execute<Key extends keyof Actions>(name: Key, ...args: Parameters<Actions[Key]>): Promise<Awaited<ReturnType<Actions[Key]>>> {
    if (!isAvailable(name)) throw new UnavailableActionError(name);
    // Promise rejection preserves the original domain error, including synchronous throws.
    return await (adapter[name]!.execute as (...args: Parameters<Actions[Key]>) => ReturnType<Actions[Key]>)(...args) as Awaited<ReturnType<Actions[Key]>>;
  }
  return { isAvailable, execute };
}

