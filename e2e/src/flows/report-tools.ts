import type { Flow } from "../flow.js";
import { step } from "../flow.js";
import { assertTrue } from "../assert.js";

/**
 * The `report-tools-registered` criterion: calling tools/list returns an
 * `ai_usage` tool declaring a `limit` parameter, a `usage_events` tool declaring
 * a `chatId` parameter, and a `user_activity` tool declaring a `startDate`
 * parameter.
 */
export const reportToolsRegistered: Flow = {
  name: "report-tools-registered",
  description: "the ai_usage, usage_events, and user_activity tools are registered with their report-specific parameters.",
  steps: [
    step("ai_usage declares a limit parameter", async (ctx) => {
      const tools = await ctx.client.listTools();
      const aiUsage = tools.find((t) => t.name === "ai_usage");
      assertTrue(aiUsage !== undefined, "ai_usage is a registered tool");

      const schema = (aiUsage as any).inputSchema ?? {};
      assertTrue(schema.properties?.limit !== undefined, "ai_usage declares a limit parameter");
    }),
    step("usage_events declares a chatId parameter", async (ctx) => {
      const tools = await ctx.client.listTools();
      const usageEvents = tools.find((t) => t.name === "usage_events");
      assertTrue(usageEvents !== undefined, "usage_events is a registered tool");

      const schema = (usageEvents as any).inputSchema ?? {};
      assertTrue(schema.properties?.chatId !== undefined, "usage_events declares a chatId parameter");
    }),
    step("user_activity declares a startDate parameter", async (ctx) => {
      const tools = await ctx.client.listTools();
      const userActivity = tools.find((t) => t.name === "user_activity");
      assertTrue(userActivity !== undefined, "user_activity is a registered tool");

      const schema = (userActivity as any).inputSchema ?? {};
      assertTrue(schema.properties?.startDate !== undefined, "user_activity declares a startDate parameter");
    }),
  ],
};
