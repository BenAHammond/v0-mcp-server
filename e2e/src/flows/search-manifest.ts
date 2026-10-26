import type { Flow } from "../flow.js";
import { step } from "../flow.js";
import { assertEqual } from "../assert.js";

/**
 * The folded capabilities, as `search` surfaces them: every removed dedicated
 * tool is now one `resource`/`action` pair in the manifest, so this flow asserts
 * the six resources and each resource's actions — the same assertions the six
 * deleted per-tool flows used to make, now read from the one on-demand manifest.
 */
const EXPECTED_ACTIONS: Record<string, string[]> = {
  chats: ["list", "get", "delete", "versions", "version", "init", "resolve_task"],
  deployments: ["create", "logs", "errors"],
  rate_limits: ["get"],
  projects: ["list", "create", "get", "update", "delete", "assign"],
  env_vars: ["list", "create", "update", "delete", "get"],
  reports: ["ai_usage", "usage", "user_activity"],
};

interface SearchResult {
  resources: Record<string, Array<{ action: string }>>;
}

export const searchManifest: Flow = {
  name: "search-manifest",
  description: "search returns the six resources with the folded capabilities as resource/action pairs.",
  steps: [
    step("search names exactly the six resources", async (ctx) => {
      const res = await ctx.client.callTool("search", {});
      const parsed = JSON.parse(res.text) as SearchResult;
      const keys = Object.keys(parsed.resources ?? {}).sort();
      assertEqual(
        JSON.stringify(keys),
        JSON.stringify(["chats", "deployments", "env_vars", "projects", "rate_limits", "reports"].sort()),
        "search names exactly chats, deployments, rate_limits, projects, env_vars, reports",
      );
    }),
    step("each resource exposes its folded actions", async (ctx) => {
      const res = await ctx.client.callTool("search", {});
      const parsed = JSON.parse(res.text) as SearchResult;
      for (const [resource, actions] of Object.entries(EXPECTED_ACTIONS)) {
        const got = (parsed.resources[resource] ?? []).map((e) => e.action);
        assertEqual(JSON.stringify(got), JSON.stringify(actions), `${resource} actions are ${actions.join(", ")}`);
      }
    }),
  ],
};
