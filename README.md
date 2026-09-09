# devtools-kit

Reusable building blocks for library devtools: a dev-only event/registry channel,
a memoised client, and a React panel shell (provider, hooks, tab plugins, and a
standalone Shadow-DOM chrome). A library supplies its own entity/event schema, a
view-model reducer, and any custom tabs — the kit provides everything else, and
compiles to nothing in production.

| Path | Description |
| --- | --- |
| `packages/devtools-kit` | `@jfdevelops/devtools-kit` — framework-agnostic channel + client |
| `packages/devtools-kit-react` | `@jfdevelops/devtools-kit-react` — React provider, hooks, panel, standalone chrome |

## Development

**Requirements:** Node `^20.19.0 \|\| >=22.12.0`, pnpm `10.28.1`, React `>=18` (peer of the React package)

```bash
pnpm install
pnpm build
pnpm test
pnpm typecheck
```

## Publishing

Changesets drives versioning. Add one with `pnpm changeset`; merging to `main`
opens/updates a release PR, and merging that publishes to npm.
