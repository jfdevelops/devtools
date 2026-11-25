# Documentation quality

Judge whether a developer can understand and use the library from these pages, not
only whether the pages are correct.

## Reader path

Check whether a developer new to the library can:

1. understand what it is for and when to use it
2. install and initialize it
3. complete a basic workflow
4. understand its important abstractions
5. find the APIs they need
6. handle common errors
7. progress toward advanced use

Report where the path breaks, such as a concept used before it is explained or a
basic task that requires reading an advanced page first.

## Page kind

Each page should be one kind (tutorial, how-to guide, explanation, or reference)
and be written like it, as `jf-docs-write` describes. Flag:

- a tutorial that offers alternatives or has steps that can't be run
- a guide that re-teaches concepts instead of linking to them
- an explanation full of instructions, or written with task headings
- a reference page that teaches, or leaves out defaults, types, or errors
- a page that mixes two kinds and should be split

## Content

For the features in scope, check that the pages answer, where relevant:

- what problem it solves and when not to use it
- what to understand or set up first
- how it interacts with related features
- what happens behind the scenes that affects the reader
- what TypeScript infers
- the mistakes a reader is likely to make

Flag:

- unexplained terminology, or terms used inconsistently between pages
- implementation details that don't change what the reader writes
- introductory examples weighed down with unrelated setup
- the same explanation repeated across pages instead of linked
- vague claims such as "simple" or "powerful" with nothing to back them up
- pages that follow a template so closely they read as generated

## Structure

Check navigation order, heading hierarchy, orphaned pages that nothing links to,
and links that send the reader to the wrong page for their need.
