<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix nx commands with the workspace's package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generate` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax

<!-- nx configuration end-->

<!--
  Everything BELOW the nx block is maintained by hand. Nx only rewrites the
  content between its start/end comments, so edits here are safe.

  This file is the single source of truth for agent instructions. CLAUDE.md
  just imports it (`@AGENTS.md`) so Claude Code picks it up too — edit here,
  not there.
-->

# Working in this repo

## Git workflow — read this before making any change

**Never commit directly to `main`.** `main` is the shared integration branch and the source
for releases, so multiple agents working on it at once will clash. All work — by any agent or
person — happens on a short-lived **feature branch**.

### Before you start editing

1. Start from an up-to-date `main`:
   ```sh
   git switch main && git pull --ff-only
   ```
2. Create a feature branch named `<type>/<short-topic>` — e.g. `feat/agora-food`,
   `fix/typecheck-cascade`, `chore/bump-nx`. Types: `feat`, `fix`, `chore`, `docs`, `refactor`.
   ```sh
   git switch -c feat/<short-topic>
   ```
   If you're already on a suitable non-`main` feature branch, keep using it. If you find
   yourself with uncommitted work on `main`, move it onto a branch before committing
   (`git switch -c feat/<short-topic>`).

### Before you commit

3. First **summarise everything you changed into one concise summary**, then turn that summary
   into the commit message. Use Conventional Commits: a `<type>(<scope>): <summary>` subject
   line in the imperative mood (~72 chars), plus a short body explaining the *why* when it
   isn't obvious from the diff. Group related edits into one logical commit rather than one
   commit per file.

### Finishing up

4. Push the branch and open a PR into `main` — don't merge locally. Keep PRs focused; history
   on `main` is squash-merged (note the `(#NN)` suffixes in `git log`).
5. Deploys are **release-gated**: merging to `main` does *not* ship anything. Acropolis Rising
   deploys only when a GitHub release is published — see
   [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml).

Only commit or push when the user asks, or when the task clearly calls for it. Never force-push
`main` or delete branches you didn't create.

## Building, testing, and gotchas

- Run tasks through Nx (`nx run`, `nx run-many`, `nx affected`) prefixed with the package
  manager: `pnpm nx build`, `pnpm nx typecheck`, `pnpm nx test`. See the nx guidelines above.
- Before opening a PR, make sure `pnpm nx affected -t lint test typecheck build` is green.
- **Typecheck cascade:** if you see a flood of `TS6305` / `TS7006` errors pointing at `*.spec`
  files, treat them as noise — find and fix the *first real* type error in app source and the
  rest disappear. Full explanation in [`README.md`](README.md).
