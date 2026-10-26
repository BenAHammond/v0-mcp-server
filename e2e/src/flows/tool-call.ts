import type { Flow } from "../flow.js";
import { step } from "../flow.js";
import { assertEqual, assertIncludes, assertTrue } from "../assert.js";

export const networkFreeToolCall: Flow = {
  name: "network-free-tool-call",
  description: "a tools/call to a network-free tool (search) succeeds and reports the manifest.",
  steps: [
    step("search reports success and the manifest", async (ctx) => {
      const res = await ctx.client.callTool("search", {});
      assertEqual(res.isError, false, "the call is not an error");
      const parsed = JSON.parse(res.text) as { success: boolean; resources: Record<string, unknown> };
      assertEqual(parsed.success, true, "the tool reports success");
      assertTrue(parsed.resources !== undefined, "the manifest is returned");
    }),
  ],
};

export const unknownToolRefusal: Flow = {
  name: "unknown-tool-refusal",
  description: "a tools/call to an unknown tool reports the failure in the body rather than throwing.",
  steps: [
    step("unknown tool reports 'not found'", async (ctx) => {
      const res = await ctx.client.callTool("no_such_tool", {});
      const parsed = JSON.parse(res.text) as { success: boolean; error: string };
      assertEqual(parsed.success, false, "the call reports failure");
      assertIncludes(parsed.error, "not found", "the error names the missing tool");
    }),
  ],
};

export const missingParamRefusal: Flow = {
  name: "missing-param-refusal",
  description: "a tools/call missing a required parameter reports the missing field.",
  steps: [
    step("missing required param reports the missing field", async (ctx) => {
      const res = await ctx.client.callTool("generate", {});
      const parsed = JSON.parse(res.text) as { success: boolean; error: string };
      assertEqual(parsed.success, false, "the call reports failure");
      assertIncludes(parsed.error, "prompt", "the error names the missing prompt parameter");
    }),
  ],
};
