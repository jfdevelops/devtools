---
name: jf-docs-review
description: Independently review user-facing library documentation in jfdevelops projects for technical correctness, documentation quality, and standards compliance, checked against source at the target version. Use for the review stage of jf-docs work or when asked to audit docs. Reports findings by default and edits only in fix mode.
---

# Review the documentation

Review documentation against the library itself. Assume nothing in the pages, the
analysis, or the plan is correct until you have checked it. This skill is complete
on its own: a reviewer needs it, `jf-docs-standards`, the scope, and the repository.

## Modes

| Mode | What it does |
| --- | --- |
| Audit | Report findings without editing files. This is the default. |
| Fix | Correct confirmed findings, then revalidate what changed. Only when asked. |
| Coverage | Report missing or insufficient documentation for the public API. |

Respect the requested mode and scope.

## Inputs

- The scope: which pages, or which changes, for example a branch diff.
- The target package, framework, and version.
- The project's own docs rules and `jf-docs-standards`.
- The analysis and plan, if there are any, as leads to check rather than evidence.

## Establish ground truth

Read, at the target version: the public package exports, the source of every API
the pages mention, its type declarations, the relevant tests, and the package
manifest. For an earlier major, read the source at that major's last release tag.

## Review three dimensions

All three must pass. A page that compiles and passes the docs check but doesn't
explain its feature well enough to use is not finished.

| Dimension | What it checks | Reference |
| --- | --- | --- |
| Technical correctness | APIs, types, versions, behavior, and examples | [technical-accuracy](references/technical-accuracy.md) |
| Documentation quality | Clarity, completeness, mental model, and learning path | [documentation-quality](references/documentation-quality.md) |
| Standards compliance | Frontmatter, layout, formatting, links, versioning, and checks | `jf-docs-standards` and its references |

For standards compliance, run the project's docs generate and check commands, plus
format and lint, when you can. In audit mode, don't keep files a generate command
changes; report the change instead.

## Severity

- **Critical:** documentation that would cause data loss, a security problem, or
  fundamentally wrong behavior.
- **High:** wrong API usage, a broken example, or a significant technical error.
- **Medium:** a missing explanation, workflow, or limitation a reader needs.
- **Low:** wording, structure, navigation, or a minor standards issue.

Prioritize confirmed issues over stylistic preference. Don't report a preference as
a finding.

## Report

For each finding give:

- severity and dimension
- file and line
- what is wrong
- the source file, symbol, or test that shows it
- what is expected, and the fix

Then give:

1. A short summary.
2. Public API coverage for the scope.
3. Example validation results.
4. Check and build results, with the commands you ran.
5. Findings, confirmed first and then suspected, each labeled.
6. What you could not verify.
7. Recommended next steps.

When a documentation workspace exists, save the report to `reviews/latest.md` and
set the review stage in `state.yaml`. Otherwise return it directly.

## Fix mode

When asked to fix:

- correct confirmed findings only, with targeted edits
- keep useful explanations
- revalidate changed examples and rerun the checks
- update affected links and navigation
- report what changed and what remains

Do not change library source unless separately authorized.

## Rules

- Review independently. Don't trust the writer's summary of what was verified.
- Ground every technical finding in source evidence.
- Separate confirmed issues from suspected ones.
- Never report a test, build, or check as passing unless you ran it.
- Don't mark unavailable verification as successful.
