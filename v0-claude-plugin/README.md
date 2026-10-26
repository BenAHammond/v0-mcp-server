# v0-claude-plugin

A Claude Code plugin that teaches Claude how to drive
[`v0-mcp-server`](https://www.npmjs.com/package/v0-mcp-server), the MCP bridge to
v0.dev's UI-generation API.

It bundles two things:

- **A skill** (`/v0-claude-plugin:generate-ui`) that walks through the
  generate → save files → deploy workflow over the three tools — `generate`,
  `request`, and `search` — so Claude knows when to call which one and in what
  order.
- **An MCP server** (`.mcp.json`) that launches `v0-mcp-server` over stdio via
  `npx`, so the tools are wired up with nothing for you to configure.

## Requirements

- Node 18 or later.
- A v0 API key (`v0_…` or `v1:…`) available in the environment as `V0_API_KEY`
  (or in a `.env` file where the server runs). Get one at
  <https://v0.dev/chat/settings/keys>. The key is never stored in this plugin.

## Install

```bash
claude plugin marketplace add BenAHammond/v0-mcp-server
claude plugin install v0-claude-plugin@v0-mcp-marketplace
```

Or, to try it without installing:

```bash
claude --plugin-dir ./v0-claude-plugin
```

Then ask Claude to "generate a signup form" and it will drive the v0 tools.
