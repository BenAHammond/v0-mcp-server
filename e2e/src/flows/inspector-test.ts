import * as fs from "node:fs";
import * as path from "node:path";
import type { Flow } from "../flow.js";
import { step } from "../flow.js";
import { assertTrue } from "../assert.js";

/**
 * The `false-green-inspector-test` criteria: the try/catch "MCP Inspector
 * Validation" block — which passed on any non-empty stdout and only checked for
 * `Cannot find module` / `SyntaxError` — is deleted, and a real check that
 * asserts the handshake's actual output exists in its place.
 */
export const falseGreenInspectorRemoved: Flow = {
  name: "false-green-inspector-removed",
  description: "the false-green MCP Inspector block is gone and a real handshake check asserts actual output.",
  steps: [
    step("the false-green Inspector block is removed", async (ctx) => {
      const p = path.join(ctx.projectRoot, "tests", "integration", "mcp-server.test.ts");
      const source = fs.readFileSync(p, "utf-8");
      assertTrue(!source.includes("MCP Inspector Validation"), "the 'MCP Inspector Validation' describe block is gone");
      assertTrue(!source.includes("toBeDefined"), "no bare toBeDefined() assertion remains");
      assertTrue(!source.includes("Cannot find module"), "no 'Cannot find module' catch clause remains");
      assertTrue(!source.includes("SyntaxError"), "no 'SyntaxError' catch clause remains");
    }),
    step("a real handshake check asserts actual output", async (ctx) => {
      const p = path.join(ctx.projectRoot, "tests", "integration", "mcp-handshake.test.ts");
      const source = fs.readFileSync(p, "utf-8");
      assertTrue(source.includes("serverInfo.name"), "the handshake test asserts the initialize serverInfo name");
      assertTrue(source.includes("toHaveLength(3)"), "the handshake test asserts the three-tool surface");
      assertTrue(source.includes("tools/call"), "the handshake test exercises a real tools/call");
    }),
  ],
};
