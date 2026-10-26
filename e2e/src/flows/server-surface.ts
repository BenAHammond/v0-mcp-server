import type { Flow } from "../flow.js";
import { step } from "../flow.js";
import { assertEqual } from "../assert.js";

export const serverSurface: Flow = {
  name: "server-surface",
  description: "the built server initializes over stdio and lists exactly the three-tool surface.",
  steps: [
    step("initialize returns server info and the tools capability", async (ctx) => {
      assertEqual(ctx.client.serverInfo.name, "v0-mcp-server", "server info names the server");
      assertEqual(JSON.stringify(ctx.client.capabilities.tools ?? null), "{}", "the tools capability is declared");
    }),
    step("tools/list returns exactly the three registered tools", async (ctx) => {
      const tools = await ctx.client.listTools();
      const names = tools.map((t) => t.name).sort();
      assertEqual(
        JSON.stringify(names),
        JSON.stringify(["generate", "request", "search"].sort()),
        "exactly generate, request, search are registered",
      );
    }),
  ],
};
