import type { Flow } from "../flow.js";
import { step } from "../flow.js";
import { assertTrue } from "../assert.js";

/**
 * The `deploy_logs` + `deploy_errors` criterion: calling tools/list returns a
 * `deploy_logs` tool with a required `deploymentId` and an optional `since`, and
 * a `deploy_errors` tool with a required `deploymentId`.
 */
export const deployLogsAndErrorsRegistered: Flow = {
  name: "deploy-logs-and-errors-registered",
  description: "the deploy_logs and deploy_errors tools are registered with the right parameters.",
  steps: [
    step("deploy_logs requires deploymentId and accepts since", async (ctx) => {
      const tools = await ctx.client.listTools();
      const logs = tools.find((t) => t.name === "deploy_logs");
      assertTrue(logs !== undefined, "deploy_logs is a registered tool");

      const schema = (logs as any).inputSchema ?? {};
      const required = schema.required ?? [];
      const props = schema.properties ?? {};
      assertTrue(required.includes("deploymentId"), "deploy_logs requires deploymentId");
      assertTrue(props.since !== undefined, "deploy_logs accepts an optional since");
    }),
    step("deploy_errors requires deploymentId", async (ctx) => {
      const tools = await ctx.client.listTools();
      const errors = tools.find((t) => t.name === "deploy_errors");
      assertTrue(errors !== undefined, "deploy_errors is a registered tool");

      const schema = (errors as any).inputSchema ?? {};
      const required = schema.required ?? [];
      assertTrue(required.includes("deploymentId"), "deploy_errors requires deploymentId");
    }),
  ],
};
