import {
  getDevtoolsChannel,
  type DevtoolsChannel,
  type DevtoolsChannelSnapshot,
} from './channel';

const EMPTY_SNAPSHOT: DevtoolsChannelSnapshot = { entities: {}, events: [] };

export interface DevtoolsOptions<VM> {
  /** Global key the library installed its channel under. */
  channelKey: string;
  /** Derive the UI-shaped view model from a raw channel snapshot. */
  reduce: (snapshot: DevtoolsChannelSnapshot) => VM;
  /** Override the channel (testing seam). */
  channel?: DevtoolsChannel | undefined;
  /** Retained-event cap on the channel. */
  maxEvents?: number;
}

/**
 * Reads a {@link DevtoolsChannel} and exposes a memoised view model plus a
 * subscription. Safe to construct in production — the channel is absent, so
 * every method returns empty data and `subscribe` is a no-op.
 */
export class Devtools<VM> {
  #channel: DevtoolsChannel | undefined;
  #reduce: (snapshot: DevtoolsChannelSnapshot) => VM;
  #cachedFrom: DevtoolsChannelSnapshot | undefined;
  #cachedViewModel: VM | undefined;
  #hasCache = false;

  constructor(options: DevtoolsOptions<VM>) {
    this.#reduce = options.reduce;
    this.#channel =
      'channel' in options
        ? options.channel
        : getDevtoolsChannel(options.channelKey);
    if (this.#channel && typeof options.maxEvents === 'number') {
      this.#channel.maxEvents = options.maxEvents;
    }
  }

  /** Whether a live channel is present (false in production). */
  get isActive(): boolean {
    return this.#channel !== undefined;
  }

  getSnapshot(): DevtoolsChannelSnapshot {
    return this.#channel?.getSnapshot() ?? EMPTY_SNAPSHOT;
  }

  /**
   * Derived view model, memoised on snapshot identity — safe to use directly as
   * a `useSyncExternalStore` getter.
   */
  getViewModel(): VM {
    const snapshot = this.getSnapshot();
    if (!this.#hasCache || snapshot !== this.#cachedFrom) {
      this.#cachedFrom = snapshot;
      this.#cachedViewModel = this.#reduce(snapshot);
      this.#hasCache = true;
    }
    return this.#cachedViewModel as VM;
  }

  subscribe(listener: () => void): () => void {
    return this.#channel?.subscribe(listener) ?? (() => {});
  }
}
