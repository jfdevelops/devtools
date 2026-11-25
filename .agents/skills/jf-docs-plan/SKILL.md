---
name: jf-docs-plan
description: Plan library documentation in jfdevelops projects by choosing each page's kind (tutorial, how-to guide, explanation, or reference), ordering the learning path, and mapping every public export to a page. Use for the plan stage of jf-docs work. Does not write pages.
---

# Plan the documentation

Design documentation that takes developers from first contact to advanced use.
Plan from the output of `jf-docs-analyze`. If there is none, or it may be out of
date, run that stage first or do the minimum source inspection needed for an
accurate plan.

Do not write full pages or change library source while planning.

## Give every page one kind

Each page serves one reader need. Decide which kind before anything else, because
the kind sets the page's structure and tone in `jf-docs-write`.

| Kind | Orientation | Purpose | Example |
| --- | --- | --- | --- |
| Tutorial | Learning | Teach through one complete, guided experience | Build your first multi-step form |
| How-to guide | Task | Help the reader reach a specific goal | Validate a step asynchronously |
| Explanation | Understanding | Explain concepts and design decisions | How schema-driven type inference works |
| Reference | Information | Describe the public API precisely | Schema configuration options |

A page that tries to be two kinds usually does neither well. Split it, and link the
two. Kinds decide how a page is written; they don't each need their own directory.
Place pages in the layout from `jf-docs-standards`.

## Order the learning path

Lay pages out so a developer:

1. learns what problem the library solves and when to use it
2. installs and configures it
3. gets a meaningful result quickly
4. understands its mental model
5. completes common tasks
6. uses advanced capabilities
7. extends it and troubleshoots it

Don't require developers to understand internals before they can finish a basic
task. Introduce each concept before the pages that depend on it.

## Choose the pages

Organize around what developers need to do, not the source file structure. Choose
from these categories, and include only those the library needs:

- overview and installation
- quick start or a first tutorial
- core concepts (explanations)
- task-oriented guides
- advanced usage
- framework integrations and plugins
- troubleshooting
- migration guides
- API reference

Prefer the fewest pages that cover the scope. Keep useful existing pages and plan
changes to them rather than replacements.

## Cover the public surface

Map every public export from the analysis to a page that teaches it. Exact
signatures belong in the API reference, generated where the project generates one.
Guides and tutorials explain when and why to use an API and link to the reference
for its signature. Explain each concept on one page, and link to it from the
others instead of repeating it.

In a monorepo, separate package-specific pages from shared concepts, plan
integration guides for workflows that span packages, and keep terminology the same
across packages. Never plan pages for private workspace packages.

## Specify each page

For every new or changed page, record:

- title, file path, and kind
- the reader and what they can do after reading
- prerequisites
- concepts and public APIs covered
- examples needed
- related pages to link to and from
- priority
- source references from the analysis

## Output

1. The documentation strategy in a few sentences.
2. The directory structure and navigation order.
3. The page specifications.
4. A coverage matrix of public exports to pages.
5. The cross-linking plan.
6. The order to write pages in.
7. Missing information or blockers.

When a documentation workspace exists, save the plan to `plan.md`, list each page
as outstanding in `progress.md`, and set the plan stage in `state.yaml`. Otherwise
return the plan directly.
