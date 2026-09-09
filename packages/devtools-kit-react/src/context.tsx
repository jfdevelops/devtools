import { createContext, useContext, type ReactNode } from 'react';
import type { Devtools } from '@jfdevelops/devtools-kit';

const DevtoolsContext = createContext<Devtools<unknown> | null>(null);

export interface DevtoolsProviderProps {
  /**
   * The devtools instance to expose. Create it once (module scope or a `useState`
   * initializer) so it stays stable across renders.
   */
  devtools: Devtools<unknown>;
  children: ReactNode;
}

export function DevtoolsProvider({ devtools, children }: DevtoolsProviderProps) {
  return (
    <DevtoolsContext.Provider value={devtools}>
      {children}
    </DevtoolsContext.Provider>
  );
}

/** Reads the {@link Devtools} instance from the nearest provider. Throws if absent. */
export function useDevtools<VM = unknown>(): Devtools<VM> {
  const devtools = useContext(DevtoolsContext);
  if (!devtools) {
    throw new Error('`useDevtools` must be used inside a `<DevtoolsProvider>`.');
  }
  return devtools as Devtools<VM>;
}

/** Like {@link useDevtools} but returns `null` instead of throwing. */
export function useOptionalDevtools<VM = unknown>(): Devtools<VM> | null {
  return useContext(DevtoolsContext) as Devtools<VM> | null;
}
