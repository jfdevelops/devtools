---
title: Installation
description: Install the core package in the library you are instrumenting and set up the bundler requirement for production exclusion.
order: 20
---

Install the core package in the library you are instrumenting. It has no UI dependency, so the library that records data stays free of React.

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

## Add a UI

To render the data with React, install `@jfdevelops/devtools-kit-react` as the [React installation](../../react/v0/installation.md) page describes. With any other framework, or with plain DOM code, read the core's clients directly. See [Derive a view model](./guides/view-models.md#read-the-view-model).

## Requirements

| Requirement | Detail |
| --- | --- |
| Node.js | `^20.19.0 \|\| >=22.12.0` |
| Module formats | The package ships ESM and CommonJS builds. |
| TypeScript | Optional. The kit is typed, and its main benefit is that types flow from your schemas without generics. If you use it, use TypeScript 5.0 or later, because `createDevtools` uses a `const` type parameter. |

## Replace `process.env.NODE_ENV` in your bundler

`IS_DEV` is `process.env.NODE_ENV !== 'production'`, and the kit reads `process.env.NODE_ENV` without checking that `process` exists. This is deliberate. A bundler can only fold the expression away, and then remove guarded code, if it sees the literal `process.env.NODE_ENV` and replaces it with a string.

Your bundler therefore needs to replace `process.env.NODE_ENV` in the build that ships to browsers. If nothing replaces it and `process` is not defined where the code runs, importing the package throws `ReferenceError: process is not defined`.

## Next steps

- Build a working inspector in the [Quick start](./quick-start.md).
- See what production builds contain in [Control devtools in production](./guides/production.md).
- Learn how types flow in [TypeScript](./typescript.md).
