import type { Flow } from "../flow.js";
import { step } from "../flow.js";
import { assertTrue } from "../assert.js";

/**
 * The `iserror-flag-never-set` criteria: a failed tool call surfaces
 * `isError: true` at the MCP response level (derived from `result.success ===
 * false`), and a successful call does not. Before the fix the flag was only set
 * in an unreachable catch branch, so failures never carried it.
 */
export const isErrorOnFailure: Flow = {
  name: "iserror-on-failure",
  description: "a failed tool call surfaces isError:true; a successful call does not.",
  steps: [
    step("a failed tool call surfaces isError true", async (ctx) => {
      const res = await ctx.client.callTool("get_chat", {});
      assertTrue(res.isError === true, "a call missing its required chatId surfaces isError:true");
      assertTrue(res.text.includes("Invalid parameters"), "the failure is also reported in the body");
    }),
    step("a successful tool call does not surface isError", async (ctx) => {
      const res = await ctx.client.callTool("logs_summary", {});
      assertTrue(res.isError === false, "a successful network-free call is not flagged isError");
    }),
  ],
};
