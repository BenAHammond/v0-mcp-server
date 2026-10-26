import type { Flow } from "../flow.js";
import { step } from "../flow.js";
import { assertEqual, assertIncludes } from "../assert.js";

/**
 * The `request` dispatcher reaches the folded capabilities: a known
 * `{resource, action}` pair is found and its params validated (a missing
 * required param names its field — proof the operation was found and its schema
 * enforced, all without a network call), while an unknown pair is refused.
 */
export const requestFoldedOp: Flow = {
  name: "request-folded-op",
  description: "request finds a known resource/action (its params validated) and refuses an unknown one.",
  steps: [
    step("request finds a known operation and validates its params", async (ctx) => {
      const res = await ctx.client.callTool("request", { resource: "chats", action: "get", params: {} });
      const parsed = JSON.parse(res.text) as { success: boolean; error: string };
      assertEqual(parsed.success, false, "a known op with missing required params reports failure");
      assertIncludes(parsed.error, "chatId", "the chats.get op's required chatId is enforced");
    }),
    step("request refuses an unknown operation", async (ctx) => {
      const res = await ctx.client.callTool("request", { resource: "bogus", action: "nope", params: {} });
      const parsed = JSON.parse(res.text) as { success: boolean; error: string };
      assertEqual(parsed.success, false, "an unknown operation reports failure");
      assertIncludes(parsed.error, "Unknown operation", "the refusal names the unknown operation");
    }),
  ],
};
