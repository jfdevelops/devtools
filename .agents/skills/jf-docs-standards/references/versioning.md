# Versioning

## Choose the version directory

- Write a change in the version directory whose release it describes. A feature
  added in 4.x goes in `v4/`.
- Change an earlier major only to fix something that was wrong at that release.
- For an earlier major, read the source at that major's last release tag, for
  example `git show <package>@<version>:<path>`, not the default branch.
- Never invent dates, versions, or release facts. Take them from the changelog,
  the package manifest, or git tags.

## Name versions only when they matter

Don't name the page's own version in its title, description, or intro. The URL and
version selector already show it. Name another version only for a real
cross-version fact: a migration step, an "added in 4.1.0" note, or a
compatibility table. Migration page titles are the exception, for example
"Migrating from v3 to v4".

## Pin installs by major

Pin versions the same way in all four install fences (see
[formatting](formatting.md#install-commands)).

- **Current major:** install unpinned, or pin a release of that major.
- **Earlier majors:** pin every package to an exact version, with the main package
  at that major's last release, so copying an old guide never installs the latest
  major.

## When a new major ships

The generator writes a reference only for the current major, and that reference is
never committed. Without these steps the outgoing major is left with none. Do them
in one change, before or with the version bump:

1. Write `reference/api.md` for the outgoing major by hand. Take the exports from the
   package entry points at that major's last release tag, and name the version and
   tag in the intro. Don't copy the generated output: it spans many pages and is
   marked as generated, so the docs check rejects it outside the current major.
   Delete the generated pages from that `reference/` folder, so only `api.md` is left.
2. In the outgoing major's pages, change links from `reference/index.md` and its
   subpages to `reference/api.md`, with anchors that exist there.
3. Add the `v<major>/` directory for the new major. If the project ignores the
   generated reference by path, move that ignore entry to the new major.
4. Run the project's docs generate and check commands.
