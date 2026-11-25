---
name: jf-docs-analyze
description: Analyze a library before documenting it in jfdevelops projects, covering its public API, mental model, TypeScript inference, runtime behavior, and extension points, from source at the target version. Use for the analyze stage of jf-docs work. Does not write pages.
---

# Analyze the library

Understand the library the way a developer will use it, and establish a sourced
foundation that planning, writing, and review can trust. Go further than listing
exports: reconstruct the library's mental model.

Do not write documentation pages or change library source during analysis.

## Scope and reuse

Confirm the package, framework, and target version from `jf-docs`. Never assume the
latest major. In a monorepo, read only the packages in scope and what they depend
on; identify which packages are public and which are internal.

If a documentation workspace exists, read `state.yaml` first. Reuse analysis marked
`current` and re-analyze only `stale` packages, as `jf-docs` describes.

## Sources of truth

- For the current major, read the default branch. For an earlier major, read the
  source at that major's last release tag, for example
  `git show <package>@<version>:<path>`.
- Treat source and tests as evidence. Treat existing docs, comments, and earlier
  analysis as claims to check.
- Take dates, versions, and release facts from the changelog, the package manifest,
  or git tags. Never invent them.

Start from the public entry points: the `exports` map in each `package.json` and the
files it names. Then follow into source, type declarations, tests, examples, and
existing docs.

## Public surface

For each export a developer can import, record:

- name, import path, and kind (function, class, hook, component, type, constant)
- what it is for
- parameters, options, defaults, and return value
- generic parameters and what they infer
- errors it raises and its limitations
- deprecation or stability status, only when the source states it
- related exports

An exported symbol is not public if the entry points don't expose it or it is
marked internal. Don't document internals as supported API.

## Mental model

Work out the concepts a developer must hold in their head. For a multi-step form
library, for example:

- what a form, a step, a field, and a schema each are
- how those abstractions relate to and contain one another
- how state is created, changed, and read
- how TypeScript inference flows from the developer's input through the API
- how plugins or adapters interact with the core
- what happens at compile time versus at runtime
- which patterns are recommended, which are supported, and which are unsupported
- what a developer must understand before their first use

Name the library's own terms and use them consistently from here on.

## Type behavior

Pay particular attention to generic inference, overloads, conditional and mapped
types, discriminated unions, schema-derived types, narrowing, and type
augmentation by plugins. Trace each complex type until you can state what the
developer sees, such as "the step's `values` are typed from its schema", not how
the utility types are built.

## Runtime behavior

From implementation and tests, establish lifecycle and call order, initialization
requirements, state transitions, defaults, side effects, error conditions, edge
cases, and integration requirements. State performance characteristics only when
there is evidence.

When docs, tests, and source disagree, record the disagreement instead of choosing
one.

## Output

Produce notes that later stages can use without rereading everything:

1. Target package, framework, version, and source revision.
2. Package map: public packages, internal packages, and how they depend on each
   other.
3. Public API inventory.
4. The mental model and its terms.
5. Type behavior a developer needs to know.
6. Runtime behavior, errors, and limitations.
7. Primary workflows, then advanced workflows and extension points.
8. Gaps in the existing docs.
9. Open questions and contradictions.

Cite a file and symbol for every important fact, and label anything you inferred.

When a documentation workspace exists, save the notes there: one
`analysis/<package>.md` per package, the mental model in `concepts.md`, and the
inventory in `api-inventory.json` as an array of
`{ "name", "importPath", "kind", "package", "source", "documentedIn" }`. Update
`state.yaml` with the source revision and each package's status. Otherwise return
the notes directly.
