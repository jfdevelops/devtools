---
title: Installation
description: Install the core and React packages in the right places and set up the bundler requirement for production exclusion.
order: 20
---

Install the core package in the library you are instrumenting, and the React package in the package that renders the devtools. They are separate installs because the instrumented library should not depend on React.

## Install the core package

Add `@jfdevelops/devtools-kit` to the library that records data, along with a [Standard Schema](https://standardschema.dev) library to describe that data. The examples in these docs use Zod.

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

Any library that implements Standard Schema v1 works, including Valibot and ArkType. The kit takes types from each schema's output type.

## Install the React package

Add `@jfdevelops/devtools-kit-react` to the package that renders the panel. It depends on `@jfdevelops/devtools-kit`, so the core installs with it. A published release of the React package depends on the core release with the same version, for example 0.2.0. Keep the core you install in the instrumented library on that same release. Otherwise your dependency tree can hold two copies of the core. The channel still works across copies, but the `Devtools` type from one copy is not assignable to the other's.

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

The React package has two peer dependencies, `react` and `react-dom`, both version 18 or later.

If the devtools package only renders the panel, you can import everything it needs from `@jfdevelops/devtools-kit-react`, which re-exports most of the core. The exceptions are listed in the [React package reference](./plugins/react.md#core-exports-missing-from-the-root-entry). The instrumented library still imports `@jfdevelops/devtools-kit` directly.

## Requirements

| Requirement | Detail |
| --- | --- |
| Node.js | `^20.19.0 \|\| >=22.12.0` |
| Module formats | Both packages ship ESM and CommonJS builds. |
| TypeScript | Optional. The kit is typed, and its main benefit is that types flow from your schemas without generics. If you use it, use TypeScript 5.0 or later, because `createDevtools` uses a `const` type parameter. |

## Replace `process.env.NODE_ENV` in your bundler

`IS_DEV` is `process.env.NODE_ENV !== 'production'`, and the kit reads `process.env.NODE_ENV` without checking that `process` exists. This is deliberate. A bundler can only fold the expression away, and then remove guarded code, if it sees the literal `process.env.NODE_ENV` and replaces it with a string.

Your bundler therefore needs to replace `process.env.NODE_ENV` in the build that ships to browsers. If nothing replaces it and `process` is not defined where the code runs, importing either package throws `ReferenceError: process is not defined`.

The React root entry also reads `process.env.NODE_ENV` once when it loads, to decide whether `DevtoolsStandalone` renders by default.

## Next steps

- Build a working panel in the [Quick start](./quick-start.md).
- See what production builds contain in [Control devtools in production](./guides/production.md).
- Learn how types flow in [TypeScript](./typescript.md).
