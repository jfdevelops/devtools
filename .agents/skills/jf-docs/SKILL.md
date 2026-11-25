---
name: jf-docs
description: Orchestrate the analysis, planning, writing, editing, migration, and review of user-facing library documentation in jfdevelops projects, including guides, installation and quick-start pages, versioned docs, and docs for a new major. Read before any docs change, even when the request only says to document a feature, update a guide, or fix a link.
---

# Documentation orchestrator

Coordinate documentation work through the specialized documentation skills. Your job
is to establish scope, choose the smallest workflow that does the task, run its
stages in order, and confirm the documentation is complete.

These skills cover user-facing library docs written as Markdown pages for a docs
site. They do not cover READMEs, code comments, changelogs, or maintainer notes,
except where those link into the docs.

Do not replace a specialized skill with your own abbreviated version of it. The
goal of every stage is developer understanding. Correctness and formatting are
requirements, not the goal.

## Load the related skills

| Skill | Responsibility |
| --- | --- |
| [jf-docs-standards](../jf-docs-standards/SKILL.md) | Layout, versioning, frontmatter, formatting, links, and checks |
| [jf-docs-analyze](../jf-docs-analyze/SKILL.md) | Understand the library and its mental model |
| [jf-docs-plan](../jf-docs-plan/SKILL.md) | Design the learning path and page plan |
| [jf-docs-write](../jf-docs-write/SKILL.md) | Write the content for each kind of page |
| [jf-docs-review](../jf-docs-review/SKILL.md) | Independently validate accuracy, quality, and standards |

The skills are installed next to this one. If a link does not resolve, look in the
agent's other configured skill directories.

- Read `jf-docs-standards` before any documentation work.
- Read each specialized skill before running its stage. Referencing a skill does
  not load it; open and read its `SKILL.md`.
- If a skill is missing, say so, then run that stage from the instructions you
  have. Recommend installing the full set of `jf-docs` skills.

## Instruction precedence

1. System and agent instructions.
2. Current user instructions.
3. The project's own documentation rules.
4. `jf-docs-standards`.
5. The defaults in the specialized skills.

## Determine scope

Before choosing a workflow, identify:

- the library and the packages affected
- the framework
- the target version or release; never assume the latest major
- the existing documentation structure
- the requested change and the public APIs it touches
- related pages that may need to change with it
- the verification tooling the project has

## Select a workflow

Choose the smallest workflow that does the task.

### Full documentation

For an undocumented library, a comprehensive rewrite, or a large documentation
initiative.

1. Analyze.
2. Plan.
3. Write.
4. Review.
5. Resolve confirmed findings.
6. Verify.

### Feature documentation

For a new feature or a substantially changed API.

1. Analyze the affected APIs and how they relate to the rest of the library.
2. Identify the affected pages.
3. Plan new pages or changes where needed.
4. Write.
5. Review the affected documentation.
6. Verify.

### Incremental update

For targeted changes to existing documentation.

1. Inspect the affected pages and source.
2. Identify related pages and examples that also need to change.
3. Write the targeted changes.
4. Review and verify.

Do not audit the whole repository for a small change.

### Documentation review

When the user asks for an audit.

1. Establish scope.
2. Analyze the relevant source.
3. Run `jf-docs-review`.
4. Report findings.

Do not modify files unless asked to.

### New major release

1. Analyze the outgoing and incoming majors.
2. Follow the new-major procedure in `jf-docs-standards`.
3. Identify breaking changes.
4. Plan the migration guide.
5. Update affected guides and examples.
6. Review version-specific accuracy.
7. Generate and verify the docs.

### Editorial change

For wording, formatting, frontmatter, navigation, or link-only changes.

1. Read the project's rules and `jf-docs-standards`.
2. Make the targeted change.
3. Run the docs checks.

Do not analyze or plan.

## Coordinate stages

Each stage must leave enough for the next stage to work without rediscovering the
same context. Pass the scope, the target version, and the earlier stages' output
to each stage, especially when a stage runs in a separate agent or context.

Do not pass an assumption from one stage to the next as a verified fact. Label
inferences as inferences.

## Keep a documentation workspace

For substantial work (full documentation, feature documentation, or a new major),
keep intermediate files in a documentation workspace so later sessions and other
agents can reuse them instead of re-analyzing the library.

Use the project's configured workspace if it has one. Otherwise use
`.docs-workspace/` at the repository root. Keep it outside the published docs, and
add it to `.gitignore` unless the project chooses to commit it.

```text
.docs-workspace/
  state.yaml            source revision, target major, stage and package status
  analysis/<package>.md analysis per package
  api-inventory.json    public exports and where each is documented
  concepts.md           the mental model and its terms
  plan.md               page plan and coverage
  progress.md           pages written, reviewed, and outstanding
  reviews/latest.md     the most recent review report
```

`state.yaml` records what the analysis was based on:

```yaml
schemaVersion: 1
source:
  revision: 'abc1234'
  major: 4
stages:
  analyze: completed
  plan: completed
  write: in-progress
  review: pending
packages:
  core:
    analysis: analysis/core.md
    status: current
  plugins:
    analysis: analysis/plugins.md
    status: stale
```

For small changes, keep findings in the working context and create no files.

### Reuse analysis

Before analyzing, read `state.yaml` if it exists. Compare the recorded revision
with the current one, for example with `git diff --stat <revision>..HEAD`, and
mark the packages whose source changed as `stale`. Re-analyze only stale packages
and the concepts they touch, then record the new revision. Reuse current analysis
as-is. Discard it entirely if the target major changed.

## Review independently

Review in a context that did not write the pages. When the environment provides a
dedicated reviewer, such as a separate agent or a different model, hand the review
to it with:

- the documentation scope
- the target version
- the relevant source
- the changed pages
- `jf-docs-standards` and `jf-docs-review`

The reviewer must verify technical claims itself. If no independent reviewer is
available, run a separate review pass that rereads the source instead of trusting
the writer's notes.

## Completion criteria

Documentation is complete only when:

- every technical claim is supported by source at the target version
- the requested functionality is explained well enough to use
- public APIs are represented accurately
- examples are valid and verified as far as the tooling allows
- related pages are updated
- version rules in `jf-docs-standards` are met
- the docs generate and check commands pass
- confirmed review findings are resolved

Never change library source or weaken a check to make documentation pass. Report
any verification you could not complete.

## Final report

Summarize:

- the scope
- pages created or updated
- important documentation decisions
- verification run and its results
- remaining issues or limitations

Follow `jf-git` for branches, commits, and pull requests. Do not commit or open a
pull request unless the user or the project's workflow authorizes it.
