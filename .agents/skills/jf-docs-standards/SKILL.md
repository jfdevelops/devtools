---
name: jf-docs-standards
description: Shared rules for user-facing library documentation in jfdevelops projects, covering docs layout, versioned directories, new-major rollover, frontmatter, headings, code and install fences, links, and docs checks. Read before any documentation work, usually through jf-docs.
---

# Documentation standards

These are the deterministic rules for library documentation: a page either follows
them or it doesn't. How to understand a library and write good content lives in
`jf-docs-analyze`, `jf-docs-plan`, and `jf-docs-write`.

## Read the current project first

Before editing, read the project's own docs rules. Look for a docs README, a
content contract or style guide (often under `docs/maintainers/`), the docs check
and generate scripts in `package.json`, and two or three existing pages near the
one you are changing. A project's rules take precedence over these defaults, and
current user instructions take precedence over both. Use these defaults only where
the project is silent.

Identify these before writing:

- where pages for each framework and version live
- which files are generated (navigation, manifests, the API reference), because
  generated files are never edited by hand
- the allowed frontmatter keys and Markdown features
- the commands that generate and check the docs

## Read the relevant reference

| Reference | Read before |
| --- | --- |
| [layout](references/layout.md) | Adding, moving, or deleting a page, or touching navigation or the API reference |
| [versioning](references/versioning.md) | Choosing a version directory, writing about another version, pinning installs, or shipping a new major |
| [formatting](references/formatting.md) | Writing frontmatter, headings, callouts, code, install commands, or links |

## Checks

- Run the project's docs generate and check commands, plus its format and lint
  commands. All must pass. Fix the page rather than weakening the checker.
- If formatting touches a file you did not edit and the only change is line
  endings, restore that file.
- A docs-only change usually uses the `docs` commit type and needs no release
  entry unless the project says otherwise. Follow `jf-git` for the rest.

Passing these checks means a page meets the standards. It does not mean the page
is accurate or useful; `jf-docs-review` checks that.
