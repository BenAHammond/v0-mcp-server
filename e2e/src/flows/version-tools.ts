import type { Flow } from "../flow.js";
import { step } from "../flow.js";
import { assertTrue } from "../assert.js";

/**
 * The `version-tools-registered` criterion: calling tools/list returns a
 * `list_versions` tool whose `chatId` is required, and a `get_version` tool
 * whose `chatId` and `versionId` are both required.
 */
export const versionToolsRegistered: Flow = {
  name: "version-tools-registered",
  description: "the list_versions and get_version tools are registered with the right required parameters.",
  steps: [
    step("list_versions requires chatId", async (ctx) => {
      const tools = await ctx.client.listTools();
      const list = tools.find((t) => t.name === "list_versions");
      assertTrue(list !== undefined, "list_versions is a registered tool");

      const schema = (list as any).inputSchema ?? {};
      const required = schema.required ?? [];
      assertTrue(required.includes("chatId"), "list_versions requires chatId");
    }),
    step("get_version requires chatId and versionId", async (ctx) => {
      const tools = await ctx.client.listTools();
      const get = tools.find((t) => t.name === "get_version");
      assertTrue(get !== undefined, "get_version is a registered tool");

      const schema = (get as any).inputSchema ?? {};
      const required = schema.required ?? [];
      assertTrue(required.includes("chatId"), "get_version requires chatId");
      assertTrue(required.includes("versionId"), "get_version requires versionId");
    }),
  ],
};
