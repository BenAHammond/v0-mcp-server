import type { McpClient } from "./client.js";

/**
 * The flow runner.
 *
 * A flow is a named sequence of steps; each step makes MCP calls against a freshly
 * spawned server and asserts on the response. The runner stops a flow at its first
 * failing step, so a downstream assertion never runs against an already-broken
 * server.
 */

export interface FlowContext {
  /** A freshly spawned, already-initialized server process for this flow. */
  client: McpClient;
  /** The project root (`v0-mcp-server/`) a flow's checks read from. */
  projectRoot: string;
  log: (message: string) => void;
}

export interface Step {
  name: string;
  run: (ctx: FlowContext) => Promise<void>;
}

export interface Flow {
  name: string;
  description: string;
  steps: Step[];
}

export interface StepResult {
  step: string;
  ok: boolean;
  error?: string;
}

export interface FlowResult {
  flow: string;
  /** True when every step passed. */
  ok: boolean;
  steps: StepResult[];
}

/** Convenience constructor for a single step. */
export function step(name: string, run: Step["run"]): Step {
  return { name, run };
}

export async function runFlow(flow: Flow, ctx: FlowContext): Promise<FlowResult> {
  const steps: StepResult[] = [];

  for (const s of flow.steps) {
    try {
      await s.run(ctx);
      steps.push({ step: s.name, ok: true });
      ctx.log(`  ✓ ${s.name}`);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      steps.push({ step: s.name, ok: false, error: message });
      ctx.log(`  ✗ ${s.name}: ${message}`);
      break; // fail fast
    }
  }

  const ok = steps.length === flow.steps.length && steps.every((s) => s.ok);
  return { flow: flow.name, ok, steps };
}
