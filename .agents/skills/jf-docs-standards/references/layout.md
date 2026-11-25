# Layout

The default layout is versioned by framework and major:

```text
docs/
  README.md                  repository index, not published
  framework/<framework>/
    v<major>/
      overview.md            top-level pages: overview, installation,
      installation.md        quick-start, typescript, devtools
      guides/*.md            how-to guides, troubleshooting, migration
      plugins/*.md           companion packages
      reference/             current major: generated API reference, never committed
                             earlier majors: hand-written reference/api.md
      assets/*               images only
  maintainers/               contributor notes, never public
```

Page kinds from `jf-docs-plan` (tutorial, how-to guide, explanation, reference) do
not need their own directories. Place each page where this layout or the project's
layout puts it.

## Pages

- Keep pages out of the docs root.
- When a page moves, update every link to it rather than leaving a stub. That
  includes package READMEs and other repository files that link into the docs.
- Generate navigation from the pages. Do not keep hand-written ordering files in
  sync with frontmatter.
- Never link a public page to maintainer notes.

## API reference

- Never edit the current major's generated reference.
- Earlier majors keep a hand-written `reference/api.md` that the generator never
  touches. Correct it directly, checked against that major's last release tag.
- Link to the reference instead of copying signatures into a guide:
  `reference/index.md` or a page under it in the current major, and
  `reference/api.md` in earlier majors.

## Workspace

Intermediate files from `jf-docs` (analysis, plans, reviews) live in the
documentation workspace, by default `.docs-workspace/` at the repository root.
Never put them under `docs/`, and never link to them from a public page.
