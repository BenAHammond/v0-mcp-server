import { McpClient } from "./client.js";
import { loadConfig } from "./config.js";
import { runFlow, type Flow, type FlowResult } from "./flow.js";
import { flows } from "./flows/index.js";

async function main(): Promise<void> {
  const config = loadConfig();
  const argv = process.argv.slice(2);
  // Positional arguments name the flows to run. A bare run plays the whole suite;
  // passing one or more names runs just those, by name. An unknown name is
  // reported rather than silently ignored.
  const requested = argv.filter((a) => !a.startsWith("--"));
  const unknown = requested.filter((name) => !flows.some((f) => f.name === name));
  const selected = requested.length === 0 ? flows : flows.filter((f) => requested.includes(f.name));

  console.log("v0-mcp-server — end-to-end acceptance");
  console.log(`  library: ${config.libPath}`);
  console.log("");
  if (requested.length > 0) {
    console.log(`  running ${selected.length} of ${flows.length} flows by name: ${selected.map((f) => f.name).join(", ")}`);
    for (const name of unknown) {
      console.warn(`  ⚠ no flow named "${name}"`);
    }
    console.log("");
  }

  // Each flow spawns its own server process, so a flow's failures never leak into
  // another's process. The runner is sequential: four flows is not a concurrency
  // problem, and a sequential run is deterministic.
  const results: FlowResult[] = [];
  for (const flow of selected) {
    const client = new McpClient({ libPath: config.libPath, apiKey: config.apiKey, cwd: config.projectRoot });
    const log = (m: string) => console.log(m);
    console.log(`▸ ${flow.name}`);
    console.log(`  ${flow.description}`);
    try {
      await client.initialize();
      results.push(await runFlow(flow, { client, log }));
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      results.push({ flow: flow.name, ok: false, steps: [{ step: "initialize", ok: false, error: message }] });
      console.log(`  ✗ initialize: ${message}`);
    } finally {
      client.close();
    }
  }

  let passed = 0;
  let failed = 0;

  console.log("");
  console.log("Summary");
  for (const r of results) {
    if (r.ok) {
      passed++;
      console.log(`  PASS    ${r.flow}`);
    } else {
      failed++;
      console.log(`  FAIL    ${r.flow}`);
      for (const s of r.steps) {
        if (!s.ok) console.log(`          ✗ ${s.step}: ${s.error}`);
      }
    }
  }

  console.log("");
  console.log(`  ${passed} passed, ${failed} failed`);

  process.exitCode = failed > 0 || unknown.length > 0 ? 1 : 0;
}

main().catch((e) => {
  console.error("harness aborted:", e instanceof Error ? e.message : e);
  process.exitCode = 1;
});
