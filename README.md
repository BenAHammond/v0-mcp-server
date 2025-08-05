# v0 MCP Server (Simplified Architecture)

Generate React components with AI directly in Claude Desktop using the Model Context Protocol.

**🚀 New in v1.0.0:** Radically simplified architecture with automatic SDK discovery and direct dispatch.

## Architecture Overview

This server implements an "incredibly simple" architecture that:
- **Auto-discovers** all v0 SDK methods at runtime
- **Eliminates** complex dependency injection patterns
- **Provides** direct request → function → SDK → response mapping
- **Maintains** backward compatibility through smart aliasing

**Core Principle:** Request → Function → SDK → Response

> **Documentation**: Visit [v0-mcp-server.vercel.app](https://v0-mcp-server.vercel.app) for full documentation.

## Quick Start

```bash
# Run directly with npx (recommended)
npx v0-mcp-server

# Or install globally
npm install -g v0-mcp-server
```

## Installation & Setup

### 1. Get your v0.dev API key
Visit [v0.dev settings](https://v0.dev/chat/settings/keys) to generate an API key.

### 2. Configure Claude Desktop

Add the following to your Claude Desktop configuration file:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`  
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "v0": {
      "command": "npx",
      "args": ["v0-mcp-server"],
      "env": {
        "V0_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

### 3. Restart Claude Desktop

The v0 server will connect automatically when Claude Desktop starts.

## Usage

Simply ask Claude to create or modify components:

> "Create a modern login form with email validation"

> "Add a forgot password link and social login buttons"

## Available Tools

- **`generate_component`** - Create new React components from descriptions
- **`iterate_component`** - Refine and modify existing components

## Development

```bash
# Clone the repository
git clone https://github.com/your-username/v0-mcp-server
cd v0-mcp-server

# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build

# Run tests
pnpm test
```

## Simplified Architecture Features

### 🔍 Automatic SDK Discovery
- **Runtime Introspection**: Automatically discovers all available v0 SDK methods
- **Zero Configuration**: No manual tool registration required
- **Future-Proof**: Automatically supports new SDK methods as they're added

### 🎯 Direct Dispatch
- **No Dependency Injection**: Eliminates complex DI patterns
- **Single File Server**: Core logic in `src/server.ts` (~500 lines)
- **Direct SDK Calls**: Request → Validation → SDK Method → Response

### 🔄 Smart Compatibility
- **Legacy Tool Support**: Maintains compatibility with existing tool names
- **Parameter Transformation**: Automatically converts between legacy and new formats
- **Response Formatting**: Consistent output formatting across all tools

### 📦 Tool Coverage
The server automatically discovers and exposes:
- **Chat Operations**: `chats_create`, `chats_sendMessage`, etc.
- **Project Management**: `projects_find`, `projects_create`, etc.
- **Deployment Tools**: `deployments_list`, `deployments_logs`, etc.
- **Rate Limiting**: `rate_limits_get` for usage monitoring
- **Legacy Aliases**: `generate_component`, `iterate_component`, etc.

## Project Structure

This repository contains both the MCP server package and its documentation website:

```
v0-mcp-server/
├── src/
│   ├── server.ts                # 🚀 Main server (~500 lines)
│   ├── types.ts                 # Core types for auto-discovery
│   ├── utils/
│   │   ├── sdk-discovery.ts     # Runtime SDK introspection
│   │   ├── tool-schema.ts       # Automatic schema generation
│   │   ├── aliases.ts           # Legacy compatibility mapping
│   │   ├── param-validator.ts   # Parameter validation
│   │   └── response-formatter.ts # Response formatting
│   ├── index.ts                 # Main entry point
│   ├── cli/index.ts            # CLI interface
│   ├── config.ts               # Configuration management
│   ├── auth.ts                 # API key validation
│   └── [deprecated]/           # Legacy DI files (deprecated)
├── tests/                      # Test suites
├── docs-site/                  # Next.js documentation website
└── package.json               # Main package configuration
```

**Key Files:**
- **`server.ts`**: The heart of the simplified architecture
- **`sdk-discovery.ts`**: Auto-discovers v0 SDK methods at runtime
- **`aliases.ts`**: Maintains backward compatibility with legacy tool names
- **Deprecated**: Complex DI files marked as deprecated but kept for compatibility

## License

MIT