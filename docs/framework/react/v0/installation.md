---
title: Installation
description: Install the core and React packages in the right places and set up the bundler requirement for production exclusion.
order: 20
---

Install the core package in the library you are instrumenting, and the React package in the package that renders the devtools. They are separate installs because the instrumented library should not depend on React.

## Install the core package

Add `@jfdevelops/devtools-kit` to the library that records data, along with a Standard Schema library such as Zod to describe that data. See the [core installation](../../javascript/v0/installation.md) page for the supported schema libraries.

```npm
npm i @jfdevelops/devtools-kit zod
```

```pnpm
pnpm add @jfdevelops/devtools-kit zod
```

```yarn
yarn add @jfdevelops/devtools-kit zod
```

```bun
bun add @jfdevelops/devtools-kit zod
```

## Install the React package

Add `@jfdevelops/devtools-kit-react` to the package that renders the panel. It depends on `@jfdevelops/devtools-kit`, so the core installs with it. A published release of the React package depends on the core release with the same version, for example 0.2.0. Keep the core you install in the instrumented library on that same release. Otherwise your dependency tree can hold two copies of the core. The channel still works across copies, but the `Devtools` type from one copy is not assignable to the other's, and an `UnavailableActionError` thrown by the provider fails `instanceof` against a class from the other copy. Run `npm ls @jfdevelops/devtools-kit` or `pnpm why @jfdevelops/devtools-kit` to check, and see [Keep one copy of the core installed](../../javascript/v0/typescript.md#keep-one-copy-of-the-core-installed).

```npm
npm i @jfdevelops/devtools-kit-react
```

```pnpm
pnpm add @jfdevelops/devtools-kit-react
```

```yarn
yarn add @jfdevelops/devtools-kit-react
```

```bun
bun add @jfdevelops/devtools-kit-react
```

If the devtools package only renders the panel, you can import everything it needs from `@jfdevelops/devtools-kit-react`, which re-exports most of the core. The exceptions are listed in the [React package reference](./plugins/react.md#core-exports-missing-from-the-root-entry). The instrumented library still imports `@jfdevelops/devtools-kit` directly.

## Requirements

The React package has two peer dependencies, `react` and `react-dom`, both version 18 or later. For Node.js, module formats and TypeScript, see [Requirements](../../javascript/v0/installation.md#requirements).

## Replace `process.env.NODE_ENV` in your bundler

Both packages read `process.env.NODE_ENV` without checking that `process` exists, so your bundler must replace it with a string in the build that ships to browsers. Otherwise importing either package throws `ReferenceError: process is not defined`. The [core installation](../../javascript/v0/installation.md#replace-processenvnode_env-in-your-bundler) page explains why.

The React root entry also reads `process.env.NODE_ENV` once when it loads, to decide whether `DevtoolsStandalone` renders by default.

## Next steps

- Build a working panel in the [Quick start](./quick-start.md).
- See what production builds contain in [Control the panel in production](./guides/production.md).
- Learn where React context cannot check types in [TypeScript](./typescript.md).
