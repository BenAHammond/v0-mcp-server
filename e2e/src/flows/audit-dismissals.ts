import * as fs from "node:fs";
import * as path from "node:path";
import type { Flow } from "../flow.js";
import { step } from "../flow.js";
import { assertTrue, assertEqual } from "../assert.js";

interface DismissalEntry {
  fingerprint: string;
  rule: string;
  file: string;
  reason: string;
}

/** Read and parse the dismissals ledger, returning its entries (or [] on a missing file). */
function readDismissals(projectRoot: string): DismissalEntry[] {
  const p = path.join(projectRoot, ".codeauditor.dismissals.json");
  if (!fs.existsSync(p)) return [];
  const raw = fs.readFileSync(p, "utf-8");
  const parsed = JSON.parse(raw) as { entries?: DismissalEntry[] };
  return parsed.entries ?? [];
}

/**
 * The `stale-dismissals-cleaned` criteria: the two structural-similarity findings
 * from the now-deleted tool wrappers are pruned from the ledger, the pre-existing
 * cli-error-handler finding stays dismissed, and the API-key format literal in the
 * handshake test is deduplicated to a single occurrence.
 */
export const auditDismissalsDryFindings: Flow = {
  name: "audit-dismissals-dry-findings",
  description: "the stale tool-wrapper dismissals are pruned, the cli-error-handler finding stays, and the handshake literal is deduplicated.",
  steps: [
    step("orphaned project-tools finding is pruned", async (ctx) => {
      const entries = readDismissals(ctx.projectRoot);
      const hit = entries.find((e) => e.fingerprint === "4b775b5144efbc03414e4581f1db18796d78812b353ee628b0fd3063d767a4ea");
      assertEqual(hit, undefined, "the project-tools finding (v0-project-tools.ts) is gone from .codeauditor.dismissals.json");
    }),
    step("orphaned report-tools finding is pruned", async (ctx) => {
      const entries = readDismissals(ctx.projectRoot);
      const hit = entries.find((e) => e.fingerprint === "08ef67094ca2b07673406494ba95ec733184edae4ff653a17601762ffccc459b");
      assertEqual(hit, undefined, "the report-tools finding (v0-report-tools.ts) is gone from .codeauditor.dismissals.json");
    }),
    step("handshake-test API-key literal is deduplicated", async (ctx) => {
      const p = path.join(ctx.projectRoot, "tests", "integration", "mcp-handshake.test.ts");
      const source = fs.readFileSync(p, "utf-8");
      const needle = "❌ API key format is invalid";
      const count = source.split(needle).length - 1;
      assertEqual(count, 1, "the '❌ API key format is invalid' literal appears exactly once in mcp-handshake.test.ts");
    }),
    step("pre-existing cli-error-handler finding stays dismissed", async (ctx) => {
      const entries = readDismissals(ctx.projectRoot);
      const hit = entries.find((e) => e.fingerprint === "728379ea0b40c0ad17bab6572a8910d75e4734605c8452ca0cd4257e90de069a");
      assertTrue(hit !== undefined, "cli-error-handler finding stays dismissed in .codeauditor.dismissals.json");
      assertTrue(hit!.reason.trim().length > 0, "cli-error-handler dismissal carries a written reason");
    }),
  ],
};
