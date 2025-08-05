# v0 MCP Server

Generate React components with AI directly in Claude Desktop using the Model Context Protocol.

> **Documentation**: Visit [v0-mcp-server.vercel.app](https://v0-mcp-server.vercel.app) for full documentation.

## Quick Start

```bash
# Install directly into Claude Code
claude mcp add v0-server -- npx v0-mcp-server --api-key YOUR_V0_API_KEY

# Or install globally
npm install -g v0-mcp-server
```

### Or Configure Claude Desktop

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

## Usage

Simply ask Claude to create or modify components:

> "Create a modern login form with email validation"

> "Add a forgot password link and social login buttons"

The MCP server supports the full array of v0 SDK commands.

## License

MIT