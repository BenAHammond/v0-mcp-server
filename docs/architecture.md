# v0-mcp-server — architecture

v0-mcp-server — stack decisions and working rules (no version numbers; `package.json` is authoritative for versions).

> DRAFT, held by the agent pending a `glossaryPut("architecture", …)` once the hub is
> reachable. The portable rules are adapted from the hub's canonical architecture doc;
> the project-specific toolchain is mapped to what exists in this repo.

## Packages in use

- `@modelcontextprotocol/sdk` — the MCP server (`SimplifiedMcpServer` over stdio).
- `v0-sdk` — the v0.dev client; each tool is a hardcoded `sdkFunction` closure over its typed domains.
- `commander` + `chalk` — the CLI (`src/cli/`).
- `dotenv` — env loading (`V0_API_KEY`, …).
- `typescript`, `tsup`, `tsx` — build/dev tooling.

## Working rules

- **No unit tests.** Every check is against the built artifact (`dist/`) over its real
  surface — never `src/` internals through a unit-test runner. The checks are:
  - `pnpm test:integration` — the MCP server over stdio (the real transport, including a full `initialize → tools/list → tools/call` handshake) and the built CLI (`dist/cli/index.js`).
  - `pnpm test:cli` — `node dist/cli/index.js --validate`.
  - `pnpm mcp:test` — MCP Inspector against `dist/index.js`.
  `pnpm build` and `pnpm typecheck` are build steps, not checks. A green run of these
  is evidence that the artifact builds, not that anything is verified.

- **WHAT IS A CARD.** A card is one capability — something the system can newly do —
  or a defect, where something behaves wrongly. That is the whole list. A chore, a
  cleanup, a refactor, an investigation or a validation pass is not a card; it is a
  step inside the feature it serves.

- **Names, not integers.** A task is addressed by its name; nothing carries an integer id.

## What each step owes — the artifact, not an account of it

- **researching** — judged: the research answers with their sources, or a statement that the card carried no open questions.
- **in-development** — structural: a commit naming what was built.
- **auditing** — judged: the code-auditor's output as printed — the `code-audit changed` tool run by the agent holding the step, not a review by another actor — a findings report with its count, plus the faults it introduced fixed. `code-audit changed` is the auditor for every project; it does not vary.
- **in-test** — judged: the card's own deployed-surface check by name and its printed output (per criterion). Runs a subset — the card's own checks, never the full suite.
- **rewrite** — judged: what changed, against the criteria that failed the previous review.
- **covering** — judged: the full deployed-surface run and its printed output, plus what was added for coverage and why.
- **deploying** — structural: a call against the published package (`npx v0-mcp-server`) exercising the change, and its response. There is no `workers.dev` — this is an npm library + CLI, so "deploy" is `npm publish`.

## What must not be built

- No runtime SDK introspection ("auto-discovery") — TS types erase at runtime; tool registration is explicit hardcoded closures. (Already removed.)
