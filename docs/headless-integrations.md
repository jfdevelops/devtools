# Headless integrations

Import `@jfdevelops/devtools-kit-react/headless` for providers, hooks and unstyled
primitives without the standalone preset or its CSS. Existing root exports and
`<DevtoolsProvider devtools={client}>` remain supported. `DevtoolsPanel` remains
the legacy styled tab preset; new compositions use `DevtoolsPanelContent` or just
their own markup. No breaking export changes are required.

## Minimal external source

```tsx
import {
  createExternalStoreClient, DevtoolsProvider, useDevtoolsViewModel,
  useDevtoolsActions,
} from '@jfdevelops/devtools-kit-react/headless';

type Requests = { requests: readonly { id: string; url: string }[] };
type Actions = { retry: (id: string) => Promise<boolean> };

function RequestInspector() {
  const snapshot = useDevtoolsViewModel<Requests>();
  const commands = useDevtoolsActions<Actions>();
  return <ul>{snapshot.requests.map(request =>
    <li key={request.id}>
      {request.url}
      <button disabled={!commands.isAvailable('retry')}
        onClick={async () => {
          try { await commands.execute('retry', request.id); }
          catch (error) { /* Render the domain failure in your own UI. */ }
        }}>Retry</button>
    </li>
  )}</ul>;
}

// Create once per source identity, e.g. useMemo in the library's wrapper.
const client = createExternalStoreClient(requestStore);
const actions = { retry: { execute: (id: string) => requestStore.retry(id) } };
<DevtoolsProvider client={client} actions={actions}>
  <RequestInspector />
</DevtoolsProvider>;
```

The source supplies `subscribe`, `getSnapshot`, and optionally
`getServerSnapshot`. Methods may use `this`; the adapter preserves their receiver.
Snapshots must keep identity until data changes, including server snapshots.
The client memoizes projections and never mirrors data into the global channel.
It subscribes only when a consumer subscribes. Each unsubscribe belongs to its
caller; neither provider nor client disposes the source. Actions are separate
from snapshots. Missing or unavailable commands reject with
`UnavailableActionError`; execution failures reject with the original error.
Availability is checked at invocation. If availability changes, notify through
your source to rerender its controls.

## React Layout adapter boundary

This repository does not contain React Layout. Its actual migration must be made
in that library, preserving `source={layouts}` and its existing inspection UI.
Its wrapper can memoize `createExternalStoreClient(source)` for an existing
`InspectionSource` that implements the external-store contract. If method names
differ, pass closures forwarding subscribe/getSnapshot/getServerSnapshot.
Keep graph IDs, edges, mounted counts, links, lazy-load metadata and preview
commands in its existing protocol. Do not flatten them into kit entities.

Wrap existing explorer, toolbar and inspector components with the provider.
Pass preview commands as an action adapter, retaining instance IDs and the
original command argument/result types. The kit requires no graph fields. The
request example above uses a different model and command without changing the
adapter boundary. Both can render inline, under a consumer portal, or in another
devtools host.

## Optional interactions and hosts

`DevtoolsPanelRoot` owns only visibility; it supports `open`, `defaultOpen`, and
`onOpenChange`. It is separate from source data, so inspectors sharing a client
still have independent visibility. Selection/search remain consumer session
state. `useControllableState` provides the same controlled/uncontrolled convention
for consumer state. Prop changes never trigger change callbacks.

Compose `DevtoolsTrigger`, `DevtoolsClose`, and `DevtoolsPanelContent` around any
children. All forward refs and render without styles. Content closes on Escape
and restores focus. Set `modal` explicitly for dialog focus containment and
provide an accessible label. For completely custom elements use
`usePanelState` or `useDevtoolsPanel` to own the markup.

`usePanelGeometry` returns geometry and drag/resize prop getters. Spread the
getters onto consumer handles, which must forward their DOM props. Arrow keys
move/resize by one pixel; Shift increases the step to ten. Pointer listeners are
removed on release, cancellation, blur and unmount. Operations constrain geometry
to the handle's viewport. `usePanelDock` stores an optional docking preference;
`getPanelPresentationStyle` supplies floating/left/right/bottom host styles.
No animation is applied, including when reduced motion is requested. No page
space is reserved. `useDevtoolsTabs` provides roving focus, arrows, Home/End and
linked tab/panel attributes without requiring tabs in any panel.

`DevtoolsPortal` requires an explicit container. `DevtoolsShadowHost` creates and
cleans a child host in an explicit container; optional `css` accepts `nonce`.
Headless usage creates no body elements and injects no styles. Hosts activate in
client effects. The legacy standalone preset explicitly opts into a body shadow
host; its `container`, `nonce`, `injectStyles`, controlled visibility, and
`enabled` options support custom placement, CSP and production debugging.
For external styles use `injectStyles={false}` and load styles into the shadow
root, or use a consumer host. Inline legacy panels also accept a nonce.

## Persistence and production

`createPreferenceStore` accepts storage, a consumer-owned key, default value,
parse and serialize functions. Parsing owns validation, versions and migrations.
Construction does not touch storage: call `refresh()` explicitly after mount;
use `set()` and `reset()` for explicit preference writes. Subscribe via
`createExternalStoreClient` and the normal view-model hook. Storage/parse errors
remain visible to the caller. Cross-window notification is consumer-owned: call
`refresh()` from a storage listener and remove that listener in cleanup.
Persist chosen preferences only, never sources, commands or temporary previews.

Channel instrumentation is a production no-op by default. Pass `enabled: true`
to `createDevtools` and `DevtoolsStandalone` for deliberate production support.
External-store clients are always active because the consumer owns the source.
For bundle exclusion guard creation/imported usage with `IS_DEV`, or a bundler's
development constant. The production fixture tests build real optimized bundles
and distinguish guarded exclusion, unguarded no-op and explicit opt-in. A runtime
no-op alone does not promise removal of consumer schemas or wrapper code.

Compatibility note: `useDevtools` and `useOptionalDevtools` now expose the
structural `DevtoolsClient` boundary. Code using channel-only methods such as
`getSnapshot` or `isActive` through these hooks should retain its original
`Devtools` instance for those methods; `getViewModel` and `subscribe` are unchanged.
