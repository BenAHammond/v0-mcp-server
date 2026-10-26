import type { Flow } from "../flow.js";
import { step } from "../flow.js";
import { assertTrue } from "../assert.js";

const PROJECT_TOOLS = [
  "list_projects",
  "create_project",
  "get_project",
  "update_project",
  "delete_project",
  "assign_project",
];

const ENV_VAR_TOOLS = [
  "list_env_vars",
  "create_env_vars",
  "update_env_vars",
  "delete_env_vars",
  "get_env_var",
];

/**
 * The `project-env-tools-registered` criterion: calling tools/list returns the
 * six project tools and the five env-var tools; `assign_project` requires both
 * `projectId` and `chatId`, and `get_env_var` requires `environmentVariableId`.
 */
export const projectEnvToolsRegistered: Flow = {
  name: "project-env-tools-registered",
  description: "the six project tools and five env-var tools are registered with the right required parameters.",
  steps: [
    step("all six project tools are registered", async (ctx) => {
      const tools = await ctx.client.listTools();
      const names = new Set(tools.map((t) => t.name));
      for (const name of PROJECT_TOOLS) {
        assertTrue(names.has(name), `${name} is a registered tool`);
      }
    }),
    step("all five env-var tools are registered", async (ctx) => {
      const tools = await ctx.client.listTools();
      const names = new Set(tools.map((t) => t.name));
      for (const name of ENV_VAR_TOOLS) {
        assertTrue(names.has(name), `${name} is a registered tool`);
      }
    }),
    step("assign_project requires projectId and chatId", async (ctx) => {
      const tools = await ctx.client.listTools();
      const assign = tools.find((t) => t.name === "assign_project");
      assertTrue(assign !== undefined, "assign_project is a registered tool");

      const schema = (assign as any).inputSchema ?? {};
      const required = schema.required ?? [];
      assertTrue(required.includes("projectId"), "assign_project requires projectId");
      assertTrue(required.includes("chatId"), "assign_project requires chatId");
    }),
    step("get_env_var requires environmentVariableId", async (ctx) => {
      const tools = await ctx.client.listTools();
      const getVar = tools.find((t) => t.name === "get_env_var");
      assertTrue(getVar !== undefined, "get_env_var is a registered tool");

      const schema = (getVar as any).inputSchema ?? {};
      const required = schema.required ?? [];
      assertTrue(required.includes("environmentVariableId"), "get_env_var requires environmentVariableId");
    }),
  ],
};
