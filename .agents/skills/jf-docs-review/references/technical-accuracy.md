# Technical accuracy

Check each claim against the source at the target version.

## API facts

Verify:

- export names and import paths, against the package `exports`
- function signatures, parameters, and options
- generic parameters and their constraints
- default values
- return values
- type inference claims
- error conditions and messages
- lifecycle, call order, and other runtime behavior
- supported integrations and their requirements
- version compatibility and deprecation claims
- dates, versions, and release facts, against the changelog, manifest, or tags

Flag unsupported statements, outdated information, and contradictions between
pages.

## Examples

Classify each code example, then validate it for its class:

| Class | Must be |
| --- | --- |
| Complete | Runnable as written, with every import and setup step |
| Partial | Correct, with the surrounding context made clear on the page |
| Illustrative | Clearly labeled as a sketch, and consistent with the real API |
| Deliberate error | Failing for the reason the page states, under `@ts-expect-error` |

Check every example for:

- valid TypeScript syntax
- correct imports from the public package name
- correct API usage and configuration
- missing initialization or undefined variables
- incorrect or unnecessary explicit type arguments
- `any`, `@ts-ignore`, or casts that hide an error
- inferred types that differ from what the page says
- runtime assumptions the library doesn't guarantee

Use the project's existing TypeScript tooling and tests to check examples when you
can. Don't install dependencies or change compiler settings without authorization.
A passing type check does not prove runtime behavior; check that separately
against implementation or tests.

## Coverage

Compare the docs in scope with the public exports. Report:

- public APIs with no documentation
- options or configuration that are never explained
- common workflows with no guide
- missing extension, integration, or error-handling guidance

Distinguish APIs that need a guide from those the generated reference covers well
enough.
