# Reference pages

A reference page states exact facts about the public API for a reader who knows
what they're looking for. It is information, not teaching.

## Generated or hand-written

Check `jf-docs-standards` before writing any reference:

- The current major's API reference is generated. Never edit it. Improve it through
  the source's doc comments only when the user asks for source changes.
- Earlier majors keep a hand-written `reference/api.md`, written from the entry
  points at that major's last release tag.
- Hand-written reference pages for the current major, such as a page of
  configuration options, are allowed when the project uses them.

## Structure for each API

1. What it is, in one sentence.
2. Import.
3. Signature.
4. Parameters and options, with types, defaults, and whether each is required.
   Prefer a table.
5. Return value.
6. Behavior: call order, side effects, and anything inferred from its arguments.
7. Errors and limitations.
8. A short example.
9. Related APIs.

Leave out a part that doesn't apply.

## Rules

- Be exact and complete for the APIs the page covers. Every name, type, and default
  must match the source at the target version.
- Keep the same structure for every entry on the page so the reader can scan it.
- Don't teach or give advice; link to the guide or explanation that does.
- Use the source's terms and names exactly. Don't rename things for readability.
