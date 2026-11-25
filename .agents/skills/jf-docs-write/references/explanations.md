# Explanations

An explanation builds the reader's mental model: what the library's concepts are,
how they relate, and why the library works the way it does. The reader wants to
understand, not to finish a task.

## Structure

- Open with the question the page answers, such as "How do steps get their types?"
- Use concept headings, such as "Steps and schemas" or "When validation runs", not
  task headings.
- Move from the whole to the parts: the overall model first, then each piece and
  how it connects.
- Close with links to the guides and reference pages that put the concept to use.

Skip "In this guide you will:". An explanation can end without "Next steps" when
the closing links already serve that purpose.

## Rules

- Prose is the main tool here. Use short code sketches to make a point concrete,
  not complete programs.
- A small diagram helps when relationships or lifecycle order are the point. Follow
  the project's rules for images and diagrams.
- Explain design decisions and trade-offs: why the library chose this approach and
  what that means for the reader.
- For type behavior, show what the reader writes and what TypeScript infers from it.
  Explain the rule the inference follows, not the utility types that implement it.
- Separate what happens at compile time from what happens at runtime.
- Keep instructions out. If the reader needs to do something, link to the guide.
