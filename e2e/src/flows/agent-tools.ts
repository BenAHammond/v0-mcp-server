import type { Flow } from "../flow.js";
import { step } from "../flow.js";
import { assertEqual, assertTrue } from "../assert.js";

/**
 * The `init_code` criterion: calling tools/list returns an `init_code` tool whose
 * `type` parameter enumerates exactly files/repo/registry/zip/template. The enum
 * is the surface-observable proof of the 5-way `chats.init` union.
 */
export const initCodeToolRegistered: Flow = {
  name: "init-code-tool-registered",
  description: "the init_code tool is registered and its type parameter enumerates files, repo, registry, zip, and template.",
  steps: [
    step("init_code's type parameter enumerates the five variants", async (ctx) => {
      const tools = await ctx.client.listTools();
      const init = tools.find((t) => t.name === "init_code");
      assertTrue(init !== undefined, "init_code is a registered tool");

      const schema = (init as any).inputSchema ?? {};
      const typeParam = schema.properties?.type;
      assertTrue(typeParam !== undefined, "init_code declares a type parameter");
      assertEqual(
        JSON.stringify(typeParam.enum),
        JSON.stringify(["files", "repo", "registry", "zip", "template"]),
        "type enumerates files, repo, registry, zip, and template",
      );
    }),
  ],
};

/**
 * The `resolve_task` criterion: calling tools/list returns a `resolve_task` tool
 * whose `taskType` parameter enumerates the five task types of `chats.resolveTask`.
 */
export const resolveTaskToolRegistered: Flow = {
  name: "resolve-task-tool-registered",
  description: "the resolve_task tool is registered and its taskType parameter enumerates the five task types.",
  steps: [
    step("resolve_task's taskType parameter enumerates the five task types", async (ctx) => {
      const tools = await ctx.client.listTools();
      const resolve = tools.find((t) => t.name === "resolve_task");
      assertTrue(resolve !== undefined, "resolve_task is a registered tool");

      const schema = (resolve as any).inputSchema ?? {};
      const taskTypeParam = schema.properties?.taskType;
      assertTrue(taskTypeParam !== undefined, "resolve_task declares a taskType parameter");
      assertEqual(
        JSON.stringify(taskTypeParam.enum),
        JSON.stringify(["confirmed-steps", "plan-exit-response", "answered-questions", "confirmed-permissions", "vercel-connect-setup"]),
        "taskType enumerates the five task types",
      );
    }),
  ],
};
