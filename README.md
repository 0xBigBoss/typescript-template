# typescript-template

A TypeScript monorepo template: nub workspaces, TypeScript 7, tsdown builds,
oxlint, oxfmt, knip, jscpd, and a Nix dev shell.

## Getting started

Create a repository from this template, then:

```sh
nub install
nub run setup      # prompts for your package scope, e.g. @myscope
nub run check
```

`setup` replaces the `@template` scope across every manifest and source file. It
does not touch the root `package.json` `name` or this README — update those by
hand, and replace or delete `LICENSE`, which covers the template rather than
whatever you build from it.

## Scripts

| Command                           | Does                                         |
| --------------------------------- | -------------------------------------------- |
| `nub run check`                   | typecheck, lint, and format check            |
| `nub run build`                   | build every package with tsdown              |
| `nub run typecheck`               | `tsc -b` across all projects                 |
| `nub run lint` / `lint:fix`       | oxlint                                       |
| `nub run format` / `format:check` | oxfmt                                        |
| `nub run knip`                    | find unused files, exports, and dependencies |
| `nub run jscpd`                   | copy-paste detection                         |
| `nub run changeset`               | record a release note                        |

## Layout

```
apps/       private applications
packages/   publishable libraries
```

Packages build with tsdown into `dist/`, unbundled, as ESM and CJS with matching
declarations. `tsc -b` emits declarations into `.tsbuild/` for typechecking only;
the two never share a directory, because tsdown cleans `dist/` on every build.

`isolatedDeclarations` is on, so exported symbols need explicit type
annotations. That is what lets tsdown generate declarations through oxc rather
than the TypeScript compiler.

## Adding a package

Copy a directory under `packages/`, then:

1. Keep the `<scope>/source` condition first in its `exports`, pointing at
   `./src/index.ts`. Typechecking resolves sibling packages from source through
   that condition, so `check` works before anything is built.
2. Add it to `references` in the root `tsconfig.json`, and in the `tsconfig.json`
   of any package that imports it.

There is no central path map to update.

## Requirements

`nub` is the package manager and runner. The Nix flake provides it along with the
rest of the toolchain:

```sh
nix develop        # or: direnv allow, using the included .envrc
```
