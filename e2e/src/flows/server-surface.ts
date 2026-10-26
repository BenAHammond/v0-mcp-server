import type { Flow } from "../flow.js";
import { step } from "../flow.js";
import { assertEqual, assertTrue } from "../assert.js";

export const serverSurface: Flow = {
  name: "server-surface",
  description: "the built server initializes over stdio and lists the full registered tool surface (30 tools).",
  steps: [
    step("initialize returns server info and the tools capability", async (ctx) => {
      assertEqual(ctx.client.serverInfo.name, "v0-mcp-server", "server info names the server");
      assertEqual(JSON.stringify(ctx.client.capabilities.tools ?? null), "{}", "the tools capability is declared");
    }),
    step("tools/list returns all 30 registered tools", async (ctx) => {
      const tools = await ctx.client.listTools();
      const names = tools.map((t) => t.name);
      assertEqual(names.length, 30, "the full 30-tool surface is registered");
      for (const expected of [
        "generate", "list_chats", "get_chat", "delete_chat", "rate_limits", "deploy",
        "deploy_logs", "deploy_errors", "list_versions", "get_version",
        "init_code", "resolve_task",
        "list_projects", "create_project", "list_env_vars",
        "ai_usage", "usage_events", "user_activity",
        "logs_summary",
      ]) {
        assertTrue(names.includes(expected), `tool ${expected} is registered`);
      }
    }),
  ],
};
