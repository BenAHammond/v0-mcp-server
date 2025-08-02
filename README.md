# v0 MCP Server

MCP Server for v0.dev component generation with Claude Code.

## Quick Start

```bash
# Install and run
npx v0-mcp-server --api-key your_v0_api_key

# Or set environment variable
export V0_API_KEY=your_key
npx v0-mcp-server
```

## Available Tools

- `generate_component` - Create new React components from descriptions
- `iterate_component` - Refine existing components

## Setup for Claude Code

```bash
# Add to Claude Code
claude mcp add v0 npx v0-mcp-server
```

Get your API key from: https://v0.dev/chat/settings/keys

## Development

```bash
npm install
npm run dev
```
