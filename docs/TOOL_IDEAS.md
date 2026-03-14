# v0 MCP Server - Tool Reference

A focused set of 6 tools for generating and managing UI components with v0.dev.

## Tools

| Tool | Parameters | Description |
|------|------------|-------------|
| `generate` | `prompt` (required), `chatId?`, `projectId?` | Generate UI from a prompt. Pass `chatId` to continue, omit for new. |
| `list_chats` | `limit?`, `offset?` | List your v0 chats. |
| `get_chat` | `chatId` (required) | Get chat details + files. |
| `delete_chat` | `chatId` (required) | Delete a chat. |
| `rate_limits` | — | Check API quota. |
| `deploy` | `chatId` (required), `versionId?` | Deploy to get a live URL. |

## Workflow

```
1. generate({ prompt: "A login form" })
   → { chatId, files: [{ path, content }] }

2. generate({ prompt: "Make buttons blue", chatId })
   → { chatId, files: [...updated] }

3. get_chat({ chatId })
   → { files: [...] }

4. deploy({ chatId })
   → { url: "https://..." }
```

## Design Principles

- **6 tools, not 40+**: Focused on the core generation workflow
- **No prefix**: Simple names since the server context is clear
- **Explicit chat management**: You decide when to reuse vs. start new
- **Files first**: Responses include `files: [{ path, content }]`
