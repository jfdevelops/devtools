# How-to guides

A how-to guide helps a reader who already knows the basics reach a specific goal.
The reader has a task; the guide gets them through it.

## Structure

These are defaults, not requirements. Drop a part when it would only restate
something else on the page.

- **Open with one or two sentences** that say what the guide achieves and when you
  would need it.
- **"In this guide you will:"** with three to five verb-first bullets, when the
  guide covers several steps. Skip it for a single-task guide.
- **One task per section,** with a task-style heading such as "Load a page lazily"
  or "Choose a package". Show the code, then explain what matters about it.
- **Variations and failure cases** after the main path, not interleaved with it.
- **"Next steps"** at the end: a short list of links to the pages the reader most
  likely needs next.

## Rules

- Assume the reader has installed the library and knows its core concepts. Link to
  the explanation instead of re-teaching it.
- Lead with the steps and code. Keep background to what the task needs.
- Name the goal in the title, for example "Validate a step asynchronously", not the
  API, such as "`validateAsync`".
- Cover the mistakes a reader is likely to make on this task, and what the error
  looks like when they do.
- Troubleshooting pages and migration guides are how-to guides. A migration guide
  lists each breaking change with the before and after code and the reason it
  changed.
