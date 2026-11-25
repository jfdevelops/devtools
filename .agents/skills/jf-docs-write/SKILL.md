---
name: jf-docs-write
description: Write and update user-facing library documentation in jfdevelops projects so developers understand and can use the library, with separate guidance for tutorials, how-to guides, explanations, and reference pages, and type-safe examples. Use for the write stage of jf-docs work and for fixing confirmed review findings.
---

# Write the documentation

Write documentation that developers can understand and use after one read. Focus on
content. `jf-docs-standards` covers format, and you must follow it, but a page that
follows every rule and leaves the reader confused is not done.

## Before writing

1. Read `jf-docs-standards` and the project's own docs rules.
2. Read the page's entry in the plan, and the analysis for the concepts and APIs it
   covers. If there is no plan, decide the page's kind using `jf-docs-plan`.
3. Read the source for every API the page will show. If the source changed since
   the analysis, the source wins.
4. Read the relevant tests and existing examples.
5. Read two or three neighboring pages so the new page matches them.

## Read the reference for the page's kind

| Kind | Reference |
| --- | --- |
| Tutorial | [tutorials](references/tutorials.md) |
| How-to guide | [guides](references/guides.md) |
| Explanation | [explanations](references/explanations.md) |
| Reference | [reference](references/reference.md) |

The kind decides the page's structure. Don't apply one kind's structure to another.

## Answer the reader's questions

Answer the ones that apply to the feature:

- What problem does this solve?
- Why would I use it?
- When should I not use it, and what should I use instead?
- What do I need to understand or set up first?
- How does it interact with the features around it?
- What happens behind the scenes that matters to me?
- What does TypeScript infer, and where do I have to state a type myself?
- What mistakes am I likely to make?

Leave out what the reader doesn't need, including how the implementation works
unless it changes what they write.

## Style

- Write plainly, in direct and active sentences. Address the reader as "you".
- Introduce a term before relying on it, and use the library's own terms
  consistently.
- Explain an unfamiliar idea with a concrete example rather than more abstraction.
- Prefer a table to a paragraph that lists options, packages, or terms.
- Use a callout only for a rule that is easy to miss, such as a precedence order or
  a required call order.
- Don't call a feature simple, powerful, seamless, or flexible. Show it.
- Don't repeat an explanation that lives on another page; link to it.
- Don't model the docs on another project's docs or describe them as a copy of one.
- Vary structure to fit the content. Pages that all follow one template read as
  generated.

## Examples

- Use the public API exactly as the source defines it at the target version, with
  real import paths and current signatures.
- Start with the smallest example that does something meaningful, then add one
  concern at a time.
- Keep unrelated setup out: no authentication, database, deployment, or styling
  unless the feature needs it.
- Use realistic domain names, not `foo` and `bar`.
- Make complete examples runnable. For a partial example, make the surrounding
  context clear.
- No `any`, `@ts-ignore`, or casts to make an example compile, no invented helpers,
  and no options the source doesn't have. Show a deliberate type error only with
  an `@ts-expect-error` comment that says why it fails.
- Let TypeScript infer what it can. Show the inferred type where it matters, for
  example in a comment on the variable, instead of writing out type arguments.
- Type-check examples with the project's tooling when it has a way to.

## Verify

- Check imports against the package exports, and signatures, options, and defaults
  against the source.
- Check runtime claims against implementation or tests.
- Run the checks in `jf-docs-standards`.
- Never change library source or weaken TypeScript settings to make an example
  compile.
- Never claim a check passed that you did not run.

## Finish

Report:

- pages created or updated
- public APIs they now cover
- examples added
- verification run and its results, and what you could not verify
- open questions and remaining gaps

When a documentation workspace exists, mark the pages written in `progress.md`.
