# Headless, composable devtools architecture

Status: proposed design. API examples illustrate the intended contract; they are
not documentation of APIs already implemented.

## Goal

Make devtools-kit a reusable replacement for the infrastructure behind any
library's devtools. The consuming library controls what gets rendered, which
actions are available, and where the interface is rendered.

The generic panel must be headless and composable. A library should be able to
adopt the kit while preserving its existing appearance, behavior, and public
devtools API. A styled standalone panel is an optional preset built on the same
primitives, rather than the required integration path.

"Drop-in replacement" means the kit can replace shared infrastructure without
forcing a redesign or removing existing capabilities. It does not mean the kit
can infer a library's data model, inspector UI, or commands. Each consuming
library supplies that adapter.

## Ownership

The kit owns reusable data and interaction mechanics:

- Typed entities, events, subscriptions, and stable snapshots.
- Clients and adapters for existing external stores.
- Typed action contracts and capability discovery.
- Headless React context and hooks.
- Optional panel visibility, positioning, dragging, resizing, docking, and tab
  state, with accessible interaction primitives.
- Optional persistence mechanisms and presentation presets.

The consuming library owns its domain and presentation:

- Entity and event schemas, instrumentation, and view-model derivation.
- Domain actions, their implementations, and their controls.
- Explorers, graphs, trees, inspectors, filters, and selection semantics.
- Component arrangement, styling, labels, icons, and rendered content.
- Placement and rendering host: inline content, a portal, Shadow DOM, a docked
  drawer, a custom debug page, or another devtools host.
- Its public integration API and compatibility promises.

Graph nodes, render states, form steps, routes, and requests must remain domain
concepts. They must not become mandatory fields in a universal view model.

## Architecture

### Framework-independent core

Keep the typed registry/event channel and cached client in
`@jfdevelops/devtools-kit`. Preserve schema inference and bounded event history.
The core must have no React, DOM, or storage dependency.

Support both instrumentation through the kit's channel and adaptation of an
existing source with `subscribe` and `getSnapshot`. Libraries should not need to
mirror their entire external store into a second global registry merely to use
the panel primitives. Snapshots must retain identity until data changes.

Actions are an extensible, typed contract supplied by the library. Allow commands
with arguments, return values, asynchronous results, and optional availability.
Do not hard-code actions such as selecting a graph node or forcing a render
state. A library implements those operations through its adapter.

Separate read-only snapshots from command execution. Preserve domain errors and
expose command failures to the caller without destabilizing the host app.
Capabilities must distinguish an unavailable action from a failed action.

### Headless React integration

`@jfdevelops/devtools-kit-react` supplies a provider and hooks independently of
any panel markup. A provider must work without a launcher, tabs, portal, styles,
or even a panel component.

The provider connects an explicitly supplied client and action adapter. Instances
must remain isolated, including when two inspectors use different sources from
the same library. Sharing a data source must not implicitly share selection,
search, visibility, or other session state.

Support controlled and uncontrolled interaction state with change callbacks.
Hooks and primitives should work with custom components and forwarded refs;
consumers must be able to own the markup without losing interaction behavior.
Keep subscriptions compatible with React external-store semantics and provide a
defined server snapshot where required.

### Composable interaction primitives

Expose optional building blocks for panel state, triggers, closing, drag handles,
resize handles, docking, and tab navigation. Hooks or prop getters should allow
the consumer to attach these behaviors to its own elements. Any supplied markup
components must remain unstyled and avoid imposing a content hierarchy.

Consumers can adopt each behavior separately. A panel must not require tabs,
dragging, resizing, docking, a footer, a header, or a particular layout.

Interactions must include appropriate keyboard behavior, focus handling, pointer
cleanup, and accessible attributes. Modal focus containment applies only when
the consumer explicitly selects a modal presentation. Movement and resizing must
respect viewport constraints and reduced-motion preferences where applicable.

### Rendering hosts and optional presets

Rendering location is a consumer decision. Core headless components must not
append elements to `document.body`, create a Shadow DOM, inject styles, or reserve
page space automatically.

Provide opt-in helpers or presets for floating panels, docked drawers, portals,
and Shadow DOM. A host should accept consumer content and an explicit container
when relevant. Inline and embedded integrations must work without those helpers.

Retain the existing standalone experience as a convenience preset built on the
headless layer. Built-in event-log and diagnostics tabs remain optional content.
Neither the preset nor its styles should be required by a headless import.

## Illustrative composition

```tsx
// Proposed API shape; exact names and signatures remain to be designed.
function LibraryDevtools({ source, actions, container }) {
  const client = useLibraryDevtoolsClient(source);

  return (
    <DevtoolsProvider client={client} actions={actions}>
      <LibraryLauncher />
      <LibraryPanelHost container={container}>
        <DevtoolsPanel>
          <LibraryToolbar />
          <LibraryExplorer />
          <LibraryInspector />
          <LibraryActions />
        </DevtoolsPanel>
      </LibraryPanelHost>
    </DevtoolsProvider>
  );
}
```

Here, `LibraryPanelHost` is owned by the consuming library and determines where
the content is mounted. `LibraryLauncher` can use the kit's visibility hook or
trigger primitive. Domain components read the typed view model and invoke typed
actions through the provider. The provider creates no DOM; the panel introduces
no styling or mandatory children.

An embedded integration can omit both the launcher and host. A fully custom
integration can use only the provider and hooks. An existing library can wrap
this composition behind its current public component and prop names.

## State, lifetimes, and persistence

Keep three concerns distinct:

- Source data: entities, events, mounted activity, and other domain snapshots.
- Temporary session state: selection, search, open panes, and pending actions.
- Persisted preferences: explicitly chosen settings such as size, placement,
  docking mode, or consumer-defined preferences.

Persistence is opt-in and uses a supplied storage adapter or an optional browser
helper. Consumers own storage keys, preference schemas, versioning, migrations,
validation, and reset defaults. Generic helpers may handle notification and
serialization mechanics. Do not serialize command implementations, DOM nodes,
runtime handles, transient overrides, or arbitrary source snapshots.

Define client ownership and cleanup explicitly. Unmounting one inspector must
not dispose a shared source or reset another inspector's active session.
Subscriptions, pointer listeners, portal hosts, page-space adjustments, and
temporary overrides must be cleaned up by the feature that created them.

## Production, SSR, and styling

Preserve development gating and verify production exclusion with actual built
fixtures. A production no-op and removal from the final bundle are separate
claims; neither should be assumed from an internal runtime check alone.

Keep optional always-enabled production behavior explicit so consumers with
deliberate production debugging support can retain it. Do not make the headless
architecture depend on a specific build tool or mandatory Vite integration.

Headless imports must be safe during server rendering and must not access the
DOM at module evaluation. Rendering hosts activate browser effects only when
mounted on the client.

The consuming library owns CSS. Optional styled presets should support strict
CSP through an explicit nonce or externally loaded styles and must load styles
into the correct document or shadow root. Headless usage injects no styles.

## React Layout as the first migration

React Layout is a useful acceptance case because its existing devtools already
have richer behavior than the generic kit's current standalone panel.

Preserve React Layout's `source={layouts}` API and its inspection protocol,
including stable graph identities, relationships, mounted counts, source links,
lazy-load metadata, and per-instance state-preview commands. Keep graph/tree
rendering, prop details, domain filters, and composable outlines in React Layout.

Adapt its existing `InspectionSource` directly to the generic client boundary.
Avoid replacing source-scoped inspection with a mandatory global channel.

Move reusable panel behavior into the kit as independently consumable features:
floating and docked presentation, dragging, resizing, keyboard interaction,
preference plumbing, and host lifecycle management. React Layout continues to
supply the markup and appearance, including its toolbar and responsive explorer
and inspector composition.

Retain embedded content, custom provider compositions, integration with another
devtools host, CSP support, and explicit production opt-in. Migration must not
silently replace these with the simpler standalone preset.

## Delivery sequence

1. Define the external-store adapter, typed actions, capability discovery, and
   lifecycle contracts without coupling them to UI.
2. Extract the DOM-free provider and typed hooks; separate client ownership from
   inspector session state.
3. Add headless panel and interaction primitives with controlled-state support.
4. Rebuild standalone presentation as an optional preset using those primitives.
5. Adapt React Layout incrementally while preserving its API and behavior.
6. Validate the abstraction with another library that has a different data model
   and actions, then document both minimal and advanced integrations.

Preserve existing public exports through wrappers where practical. Document any
unavoidable breaking changes and release them with the appropriate versioning.

## Acceptance criteria

- A consumer can render a complete custom inspector using only provider/hooks.
- No built-in tab, launcher, layout, action, style, or rendering host is required.
- The same content works inline, in a consumer portal or shadow root, and inside
  another devtools host without changing its domain adapter.
- Typed actions preserve arguments and results and support asynchronous failure
  and capability availability.
- Existing external stores integrate without duplicate instrumentation.
- Multiple inspectors and sources remain isolated, with explicit sharing only.
- Controlled state works without feedback loops; source updates retain stable
  snapshots and clean subscription lifetimes.
- Keyboard, focus, pointer, and cleanup behavior is verified for enabled panel
  interactions, including unmounts and React Strict Mode.
- SSR performs no browser-only work, and CSP-compatible headless usage injects
  no styles.
- Production fixtures verify the default exclusion path and deliberate opt-in.
- React Layout retains its public API and existing inspector capabilities after
  migration.
- A second, structurally different library can integrate without introducing
  domain-specific assumptions into the kit.
