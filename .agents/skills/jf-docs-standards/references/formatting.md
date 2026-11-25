# Formatting

## Frontmatter

```yaml
---
title: Lazy loading
description: Code-split whole pages and single states, with typed errors and retry.
order: 60
---
```

- Use only the keys the project allows. By default these are `title`,
  `description`, and `order`.
- `order` sets the sidebar position. Use steps of 10 so pages can be inserted
  later, and keep it unique within a directory. Check sibling pages before choosing.
- The title is plain text and follows the version rules in
  [versioning](versioning.md#name-versions-only-when-they-matter).
- The description is one sentence saying what the reader can do with the page.

## Headings

- No `#` heading. The site renders the frontmatter title as the `h1`. Sections
  start at `##`.
- Heading levels never skip.

## Callouts

A block quote opening with `**Note:**`, `**Tip:**`, or `**Warning:**` is a callout.
Use no other callout syntax unless the project allows it.

## Code

- Give every fence a language the project allows, such as `ts`, `tsx`, `json`, or
  `bash`.
- Import from the public package name, not internal paths.
- If the project type-checks examples from fixture files, keep the page's code and
  its fixture identical.

## Install commands

Write each install command once per package manager, in consecutive fences labeled
`npm`, `pnpm`, `yarn`, and `bun`, so a docs site can show them as tabs. Use
`npm i`, `pnpm add`, `yarn add`, and `bun add`, and give a development dependency
`-D` in all four. Keep install commands out of `sh` and `bash` fences.

````markdown
```npm
npm i @acme/widgets
```

```pnpm
pnpm add @acme/widgets
```

```yarn
yarn add @acme/widgets
```

```bun
bun add @acme/widgets
```
````

Pin versions as [versioning](versioning.md#pin-installs-by-major) describes.

## Links

- Link between pages with relative `.md` paths, with an optional `#anchor`. Anchors
  follow the GitHub heading slug rules.
- Cross-version links are relative too, for example `../../v3/migration.md`.
- External links use `https://`. Point to repository source with inline code or an
  `https://` link pinned to a tag, not a link into the default branch.
- Never use absolute `/` paths.
