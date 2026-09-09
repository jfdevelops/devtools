import { useCallback, useSyncExternalStore } from 'react';
import type { Devtools } from '@jfdevelops/devtools-kit';
import { useOptionalDevtools } from './context';

/**
 * Subscribes to a {@link Devtools} instance and returns its current view model,
 * re-rendering when the channel changes. `getViewModel` is memoised on snapshot
 * identity, so this is a stable `useSyncExternalStore` pairing.
 *
 * Reads from the nearest `<DevtoolsProvider>`, or from an explicit instance when
 * one is passed.
 */
export function useDevtoolsViewModel<VM = unknown>(instance?: Devtools<VM>): VM {
  const contextDevtools = useOptionalDevtools<VM>();
  const devtools = instance ?? contextDevtools;

  if (!devtools) {
    throw new Error(
      '`useDevtoolsViewModel` needs a `<DevtoolsProvider>` ancestor or an explicit instance.',
    );
  }

  const subscribe = useCallback(
    (onChange: () => void) => devtools.subscribe(onChange),
    [devtools],
  );
  const getSnapshot = useCallback(() => devtools.getViewModel(), [devtools]);

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
