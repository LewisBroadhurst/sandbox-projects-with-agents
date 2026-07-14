# Sandbox Projects with Agents

This repo is basically me just playing with claude code and seeing how far I can go with it.

# Projects

## Acropolis Rising (HTML and React versions)

Acropolis Rising is a rerun of a game I played heavily growing up called Zeus: Master of Olympus.
The goal is to recreate it and publish it so it is playable in a web browser, with very little to no code committed by myself.

# Development notes

## TypeScript `typecheck` and `noEmitOnError`

`tsconfig.base.json` sets `"noEmitOnError": false` on purpose (see issue #2).

The projects are `composite` and the `typecheck` target runs `tsc --build --emitDeclarationOnly`.
The spec project (`tsconfig.spec.json`) references the app project (`tsconfig.app.json`) and
consumes its emitted `.d.ts` files. With `noEmitOnError: true`, a single type error in app
source blocks the app project from emitting _any_ declarations, so the spec project can no
longer resolve them — one real error then cascades into a flood of misleading `TS6305`
("output file has not been built") and `TS7006` ("implicitly `any`") errors pointing at the
*.spec files instead of the actual bug.

Setting `noEmitOnError: false` lets the throwaway typecheck declarations emit even when there
is an error, so the real error stays front-and-center. This does **not** weaken type safety:
`tsc` still reports every type error and still exits non-zero, so `nx typecheck` still fails.

If you ever do see `TS6305`/`TS7006` errors in spec files, treat them as cascade noise — find
and fix the first real error in app source and the rest will disappear.
