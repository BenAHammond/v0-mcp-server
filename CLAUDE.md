# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MCP server that bridges Claude with v0.dev's UI-generation API. It exposes **three tools** — `generate` (the happy path), `request` (a generic `{resource, action, params}` dispatcher over the SDK), and `search` (serves the on-demand manifest of what `request` can do) — which dispatch to the `v0-sdk` client and return generated React component files.

## Commands

Package manager is **pnpm** (`pnpm-lock.yaml` / `pnpm-workspace.yaml`; no `package-lock.json`). `npm run` also works since scripts are standard.

```bash
pnpm install            # install dependencies
pnpm dev                # run CLI in watch mode (tsx watch src/cli/index.ts)
pnpm build              # tsup -> dist/index.js (library) + dist/cli/index.js (CLI, shebang)
pnpm typecheck          # tsc --noEmit
pnpm test               # jest (all tests/**/*.test.ts + *.spec.ts)
pnpm test:integration   # jest tests/integration
pnpm mcp:test           # MCP Inspector against dist/index.js (requires build first)
pnpm test:cli           # node dist/cli/index.js --validate (requires build first)
pnpm clean              # rimraf dist
```

Run a single test: `pnpm jest tests/integration/mcp-handshake.test.ts` or `pnpm jest -t "<test name pattern>"`.

`dist/` is gitignored (produced by `pnpm build`, and by `prepublishOnly` before `pnpm publish`). `mcp:test` and `test:cli` run against `dist/`, so build first.

## Architecture

There are **two entry points**, both ending at `SimplifiedMcpServer`:

- **`src/index.ts`** — the MCP server library. Exports `startServer(apiKey?, verbose?)` and auto-starts over stdio when run directly. This is what `mcp:test` points at.
- **`src/cli/index.ts`** — the user-facing CLI (commander + chalk). Handles `--api-key`, `--verbose`, `--validate`, graceful shutdown, and friendly error handling (`src/cli/cli-error-handler.ts`), then delegates to `startServer()`. This is the `bin` target (`npx v0-mcp-server`).

### Server lifecycle (`src/server.ts`)

`SimplifiedMcpServer`:
1. Constructor builds config via `ConfigManager` and creates an empty `Map<string, McpTool>`.
2. `start()`: validates the API key (`ApiKeyManager`), creates the v0 client (`createV0Client` from `v0-sdk`), registers the three tools, registers MCP request handlers (`ListToolsRequestSchema`, `CallToolRequestSchema`), then connects a `StdioServerTransport`.
3. `executeToolCall()`: look up tool → strip `undefined` params → `tool.execute(client, params)` (zod validation happens inside `execute`) → `formatSdkResponse`.

### Tools

Exactly **three tools**, built in `src/tools/v0-tools.ts` as `McpTool` values (`name`, `description`, `inputSchema`, `execute`). `inputSchema` is generated from a zod schema via `z.toJSONSchema()`; the same zod schema validates arguments inside `execute`.

- **`generate`** — the flagship. `prompt` + optional `chatId`: with a `chatId` it continues that chat (`chats.sendMessage`), without one it creates a new chat (`chats.create`). Returns generated files as `{path, content}`.
- **`request`** — generic `{resource, action, params}` dispatcher. Every other capability (deploy, list/get/delete chats, versions, projects, env vars, reports, init/resolve) is one `(resource, action)` pair in the manifest.
- **`search`** — returns the on-demand manifest: every resource, its actions, and each action's params. No schema reaches the consuming LLM until it asks.

`src/tools/v0-manifest.ts` is the single source of truth: 25 `V0Operation` entries (`resource`, `action`, `description`, `params` zod schema, `sdkPath`, and an optional `invoke` closure for operations that assemble a nested payload). `findOperation` / `invokeOperation` power `request`; `buildSearchManifest` powers `search`. `generate`'s schema + `invokeGenerate` live alongside it.

### Key patterns

- **zod is the validation layer.** Each operation carries a zod schema; `z.toJSONSchema()` produces the MCP `inputSchema` and `.parse()` validates arguments. `ZodError` messages are flattened to `path: message` in `formatErrorResponse`.
- **Logging goes to stderr, never stdout** — stdout is reserved for the MCP stdio protocol. `src/utils/logs.ts` (`LogManager` singleton) writes `console.error` and appends to `/tmp/v0-mcp-debug.log`. `logDebug` only prints when `VERBOSE=true`.
- **Response shaping** lives in `src/utils/response-formatter.ts`. `formatSdkResponse` is a pass-through; it only extracts `{path, content, locked}` files from a raw `object:'chat'` detail (via `formatChatDetailResponse`), so `generate` and chat-returning `request` ops surface files clearly.
- **`src/tools/helpers.ts`** provides `compact` (strips `undefined`) and `buildModelConfiguration` (builds the nested `modelConfiguration` from flat `modelId`/`thinking`/`imageGenerations`).
- **Config** (`src/config.ts`) reads `V0_API_KEY`, `V0_VERBOSE`, `V0_TIMEOUT`, `V0_MAX_MEMORY` env vars with defaults.

## API Key

Required: `V0_API_KEY` env var, `--api-key` flag, or `.env` (gitignored). Valid formats: `v1:base64:base64` or `v0_…` (`src/auth.ts` validates and redacts in `toString`/`toJSON`).

Get yours at: https://v0.dev/chat/settings/keys

## Tests

`tests/integration/` holds the only test files: `mcp-handshake.test.ts` (a real MCP handshake over stdio against `dist/index.js`, asserting the three-tool surface) and `mcp-server.test.ts` (CLI validation + build checks). Jest uses the `ts-jest` ESM preset (see `jest.config.js`); the `.js` → empty `moduleNameMapper` handles the codebase's `./x.js` import style (NodeNext-style extensions in source).

## Notes

- `.claude/` is gitignored and holds a spec-driven dev workflow (specs, commands, agents, templates) — local project-management scaffolding, not shipped code.
- `docs/TOOL_IDEAS.md` is an ideas scratchpad, not authoritative.
