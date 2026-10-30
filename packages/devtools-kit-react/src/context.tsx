import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { createActionClient, type ActionAdapter, type ActionContract, type DevtoolsClient } from '@jfdevelops/devtools-kit';

const DevtoolsContext = createContext<DevtoolsClient<unknown> | null>(null);
const ActionsContext = createContext<unknown>(null);

export type DevtoolsProviderProps<Actions extends ActionContract<Actions> = ActionContract> = {
  children: ReactNode;
  actions?: ActionAdapter<Actions>;
} & ({ client: DevtoolsClient<unknown>; devtools?: never } | { devtools: DevtoolsClient<unknown>; client?: never });

/** Borrows its client; unmounting only removes this inspector's subscriptions. */
export function DevtoolsProvider<Actions extends ActionContract<Actions>>({ client, devtools, actions, children }: DevtoolsProviderProps<Actions>) {
  const commands = useMemo(() => createActionClient(actions ?? {}), [actions]);
  return (
    <DevtoolsContext.Provider value={client ?? devtools ?? null}>
      <ActionsContext.Provider value={commands}>{children}</ActionsContext.Provider>
    </DevtoolsContext.Provider>
  );
}

export function useDevtools<VM = unknown>() {
  const devtools = useOptionalDevtools<VM>();
  if (!devtools) throw new Error('`useDevtools` must be used inside a `<DevtoolsProvider>`.');
  return devtools;
}

export function useOptionalDevtools<VM = unknown>() {
  return useContext(DevtoolsContext) as DevtoolsClient<VM> | null;
}

export function useDevtoolsActions<Actions extends ActionContract<Actions>>() {
  const actions = useContext(ActionsContext);
  if (!actions) throw new Error('`useDevtoolsActions` needs a `<DevtoolsProvider>`.');
  return actions as ReturnType<typeof createActionClient<Actions>>;
}
