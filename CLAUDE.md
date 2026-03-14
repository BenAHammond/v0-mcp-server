# CLAUDE.md

Guidance for Claude Code when working with this repository.

## Project Overview

v0 MCP Server — bridges Claude with v0.dev's UI generation API. Exposes **6 focused tools** for generating and managing components.

## Tools

| Tool | Parameters | Description |
|------|------------|-------------|
| `generate` | `prompt`, `chatId?`, `projectId?` | Generate UI. Pass `chatId` to continue. |
| `list_chats` | `limit?`, `offset?` | List chats. |
| `get_chat` | `chatId` | Get chat + files. |
| `delete_chat` | `chatId` | Delete chat. |
| `rate_limits` | — | Check quota. |
| `deploy` | `chatId`, `versionId?` | Deploy to live URL. |

## Commands

```bash
npm run dev          # Dev mode with watch
npm run build        # Build to dist/
npm run typecheck    # Type check
npm run test:unit    # Unit tests
npm run mcp:test     # Test with MCP Inspector
```

## Architecture

```
src/
├── index.ts              # Entry point
├── server.ts             # MCP server
├── tools/
│   └── v0-tools.ts       # The 6 focused tools
├── utils/
│   ├── tool-schema.ts    # Schema generation
│   ├── response-formatter.ts
│   └── logs.ts           # Debug logging
└── auth.ts               # API key validation
```

## Key Files

- **src/tools/v0-tools.ts** — Defines all 6 tools with their SDK functions
- **src/server.ts** — Registers tools and handles MCP requests
- **src/utils/tool-schema.ts** — Generates JSON schemas for MCP

## API Key

Required: `V0_API_KEY` env var or `--api-key` flag.

Get yours at: https://v0.dev/chat/settings/keys
