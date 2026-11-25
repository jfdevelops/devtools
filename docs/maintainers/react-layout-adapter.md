# React Layout adapter boundary

Maintainer note. This is not published documentation. It records how the kit's external-store boundary is meant to carry the React Layout devtools, as described in [headless-composable-devtools.md](./headless-composable-devtools.md).

This repository does not contain React Layout. Its actual migration must be made in that library, preserving `source={layouts}` and its existing inspection UI. Its wrapper can memoize `createExternalStoreClient(source)` for an existing `InspectionSource` that implements the external-store contract. If method names differ, pass closures forwarding subscribe/getSnapshot/getServerSnapshot. Keep graph IDs, edges, mounted counts, links, lazy-load metadata and preview commands in its existing protocol. Do not flatten them into kit entities.

Wrap existing explorer, toolbar and inspector components with the provider. Pass preview commands as an action adapter, retaining instance IDs and the original command argument/result types. The kit requires no graph fields. A different model, such as a request store with a retry command, uses the same adapter boundary unchanged. Both can render inline, under a consumer portal, or in another devtools host.

The user-facing guides for the pieces involved are `external-stores.md` and `actions.md`, which exist in both `docs/framework/javascript/v0/guides/` and `docs/framework/react/v0/guides/`, and `headless-panel.md` in `docs/framework/react/v0/guides/`.
