import type { Flow } from "../flow.js";
import { step } from "../flow.js";
import { assertEqual, assertIncludes, assertTrue } from "../assert.js";

export const networkFreeToolCall: Flow = {
  name: "network-free-tool-call",
  description: "a tools/call to a network-free tool (logs_summary) succeeds and reports the environment.",
  steps: [
    step("logs_summary reports success and the API key present", async (ctx) => {
      const res = await ctx.client.callTool("logs_summary", {});
      assertEqual(res.isError, false, "the call is not an error");
      const parsed = JSON.parse(res.text) as {
        success: boolean;
        result: { environment: { apiKeyPresent: boolean } };
      };
      assertEqual(parsed.success, true, "the tool reports success");
      assertTrue(parsed.result.environment.apiKeyPresent === true, "the environment reports the API key present");
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
  description: "a tools/call missing a required parameter reports invalid parameters.",
  steps: [
    step("missing required param reports invalid parameters", async (ctx) => {
      const res = await ctx.client.callTool("get_chat", {});
      const parsed = JSON.parse(res.text) as { success: boolean; error: string };
      assertEqual(parsed.success, false, "the call reports failure");
      assertIncludes(parsed.error, "Invalid parameters", "the error names the invalid parameters");
    }),
  ],
};
