# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MCP server that bridges Claude with v0.dev's UI-generation API. Claude calls MCP tools (`generate`, `list_chats`, etc.), which dispatch to the `v0-sdk` client and return generated React component files.

## Commands

Package manager is **pnpm** (`pnpm-lock.yaml` / `pnpm-workspace.yaml`; no `package-lock.json`). `npm run` also works since scripts are standard.

```bash
pnpm install            # install dependencies
pnpm dev                # run CLI in watch mode (tsx watch src/cli/index.ts)
pnpm build              # tsup -> dist/index.js (library) + dist/cli/index.js (CLI, shebang)
pnpm typecheck          # tsc --noEmit
pnpm test               # jest (all tests/**/*.test.ts + *.spec.ts)
pnpm test:unit          # jest tests/unit
pnpm test:integration   # jest tests/integration
pnpm test:playwright    # playwright test
pnpm mcp:test           # MCP Inspector against dist/index.js (requires build first)
pnpm test:cli           # node dist/cli/index.js --validate (requires build first)
pnpm clean              # rimraf dist
```

Run a single test: `pnpm jest tests/unit/v0-tools.test.ts` or `pnpm jest -t "<test name pattern>"`.

`dist/` is gitignored (produced by `pnpm build`, and by `prepublishOnly` before `pnpm publish`). `mcp:test` and `test:cli` run against `dist/`, so build first.

## Architecture

There are **two entry points**, both ending at `SimplifiedMcpServer`:

- **`src/index.ts`** — the MCP server library. Exports `startServer(apiKey?, verbose?)` and auto-starts over stdio when run directly. This is what `mcp:test` points at.
- **`src/cli/index.ts`** — the user-facing CLI (commander + chalk). Handles `--api-key`, `--verbose`, `--validate`, graceful shutdown, and friendly error handling (`src/cli/cli-error-handler.ts`), then delegates to `startServer()`. This is the `bin` target (`npx v0-mcp-server`).

### Server lifecycle (`src/server.ts`)

`SimplifiedMcpServer`:
1. Constructor builds config via `ConfigManager` and creates an empty `ToolMapping` (maps tool name → `DiscoveredMethod` → schema).
2. `start()`: validates the API key (`ApiKeyManager`), creates the v0 client (`createV0Client` from `v0-sdk`), registers tools, registers MCP request handlers (`ListToolsRequestSchema`, `CallToolRequestSchema`), then connects a `StdioServerTransport`.
3. `executeToolCall()`: look up method → `validateToolParameters` → strip `undefined` params → invoke `sdkFunction` → `formatSdkResponse`.

### Tools

Registered tools come from **five files**, grouped by workflow. Each tool is a `DiscoveredMethod` with a **hardcoded `sdkFunction` closure** wrapping the v0 SDK client — the server does *not* introspect the SDK at runtime (TS types erase at runtime, so registration is explicit).

- **`src/tools/v0-tools.ts`** — core chat/generation workflow (10 tools):

| Tool | Key params | Description |
|------|------------|-------------|
| `generate` | `prompt`, `chatId?`, `projectId?`, `system?`, `chatPrivacy?`, `modelId?`, `thinking?`, `imageGenerations?`, `attachments?` | Create a chat (`chats.create`), or continue an existing one (`chats.sendMessage`). |
| `list_chats` | `limit?`, `offset?` | List chats (shaped to id/name/updatedAt/webUrl). |
| `get_chat` | `chatId` | Chat details + files from `latestVersion.files`. |
| `delete_chat` | `chatId` | Delete a chat. |
| `rate_limits` | — | Check quota. |
| `deploy` | `chatId`, `versionId?` | Deploy to a live URL (defaults to latest version). |
| `deploy_logs` | `deploymentId`, `since?` | Deployment build logs. |
| `deploy_errors` | `deploymentId` | Deployment errors. |
| `list_versions` | `chatId`, `limit?`, `offset?` | Version history for a chat. |
| `get_version` | `chatId`, `versionId` | One version's files (mapped to path/content/locked). |

- **`src/tools/v0-agent-tools.ts`** — agent-orchestration workflow (2 tools): `init_code` (`chats.init` — flattened discriminated union over `type` files/repo/registry/zip/template) and `resolve_task` (`chats.resolveTask` — flattened 5-way `taskType` union).
- **`src/tools/v0-project-tools.ts`** — projects + env vars (11 tools): `list_projects`, `create_project`, `get_project`, `update_project`, `delete_project`, `assign_project`, `list_env_vars`, `create_env_vars`, `update_env_vars`, `delete_env_vars`, `get_env_var`.
- **`src/tools/v0-report-tools.ts`** — usage reporting (3 tools): `ai_usage` (`reports.getAIUsage`), `usage_events` (`reports.getUsage`), `user_activity` (`reports.getUserActivity`).
- **`src/tools/logs-tool.ts`** — 4 debug tools (`logs_get`, `logs_read_debug_file`, `logs_summary`, `logs_clear`) that expose the in-process `LogManager` to the LLM.

Total: **30 registered tools** (10 + 2 + 11 + 3 + 4).

### Key patterns

- **`Either<L, R>` monad** (`src/types.ts`) drives all validation. `src/utils/validation.ts` and `src/utils/param-validator.ts` return `Left(error)` / `Right(value)`; callers branch on `_tag === 'Left'`.
- **Logging goes to stderr, never stdout** — stdout is reserved for the MCP stdio protocol. `src/utils/logs.ts` (`LogManager` singleton) writes `console.error` and appends to `/tmp/v0-mcp-debug.log`. `logDebug` only prints when `VERBOSE=true`.
- **Response shaping** lives in `src/utils/response-formatter.ts`. `formatSdkResponse` is a pass-through for already-shaped tool results; it only extracts `{path, content, locked}` files from a raw `object:'chat'` detail (via `formatChatDetailResponse`). This fixes a historical data-loss bug where `list_chats`/`get_chat` fields were dropped.
- **Nested SDK unions are flattened** for the LLM: `src/tools/helpers.ts` provides `compact` (strips `undefined`), `buildModelConfiguration` (builds the `modelConfiguration` object from flat `modelId`/`thinking`/`imageGenerations`), and `requireString`. Tool schemas (`src/utils/tool-schema.ts`) map flat param names to SDK shapes and carry per-param enums via `paramEnums` (chatPrivacy, modelId, type, taskType, status, responseMode, projectPrivacy).
- **Config** (`src/config.ts`) reads `V0_API_KEY`, `V0_VERBOSE`, `V0_TIMEOUT`, `V0_MAX_MEMORY` env vars with defaults.

## API Key

Required: `V0_API_KEY` env var, `--api-key` flag, or `.env` (gitignored). Valid formats: `v1:base64:base64` or `v0_…` (`src/auth.ts` validates and redacts in `toString`/`toJSON`).

Get yours at: https://v0.dev/chat/settings/keys

## Tests

`tests/` is organized by concern: `unit/` (one test file per tool file + `auth` + `response-formatter`), `integration/` (MCP server over stdio), `server/` (request-handler wiring). Jest uses `ts-jest` ESM preset (see `jest.config.js`); the `.js` → empty `moduleNameMapper` handles the codebase's `./x.js` import style (NodeNext-style extensions in source).

## Notes

- `.claude/` is gitignored and holds a spec-driven dev workflow (specs, commands, agents, templates) — local project-management scaffolding, not shipped code.
- `docs/TOOL_IDEAS.md` is an ideas scratchpad, not authoritative.
