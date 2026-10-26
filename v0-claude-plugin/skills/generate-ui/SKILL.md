---
name: generate-ui
description: Generate and iterate on a React UI with v0.dev. Use when the user asks to build, create, generate, or modify a UI, component, page, or app — or to deploy one.
allowed-tools: mcp__plugin_v0-claude-plugin_v0__generate mcp__plugin_v0-claude-plugin_v0__request mcp__plugin_v0-claude-plugin_v0__search
---

# Generate UI with v0.dev

The `v0` MCP server drives v0.dev's UI-generation API through three tools:
`generate`, `request`, and `search`. Work them in this order.

## 1. Generate

Call `generate` with the user's request as `prompt`. This creates a new chat and
returns the generated files as `{path, content}` pairs.

- Save each returned file to disk at its `path`.
- Keep the returned `chatId` — you need it to iterate and to deploy.

## 2. Iterate

To refine the result, call `generate` again with the same `chatId` and the
follow-up instruction. To recall what an existing chat produced, use `request`
with `resource: "chats"` and `action: "get"` (or `action: "list"` to find it).

## 3. Deploy

When the user wants a live URL, call `request` with
`resource: "deployments"`, `action: "create"`, and `params: { chatId }`, then
hand back the URL it returns. If generation fails on quota, check
`request` with `resource: "rate_limits"` and `action: "get"`.

## Discovering other operations

`request` dispatches over a larger surface (projects, env vars, versions,
reports, init/resolve). Call `search` to see the full manifest of
`resource`/`action`/`params` pairs before invoking an operation you haven't used.

Do not paste raw API responses — report the saved file paths, the chat URL, and the
deploy URL.
