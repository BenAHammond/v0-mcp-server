import * as fs from "node:fs";
import * as path from "node:path";
import type { Flow } from "../flow.js";
import { step } from "../flow.js";
import { assertEqual, assertTrue } from "../assert.js";

/**
 * The `version-2.0.1` criteria: the server reports the version read from
 * `package.json` (2.0.1) through `src/version.ts`, and no entry point still
 * hardcodes the old `'1.0.0'` default.
 */
export const versionFromPackageJson: Flow = {
  name: "version-from-package-json",
  description: "the server reports the package.json version (2.0.1), not the hardcoded 1.0.0.",
  steps: [
    step("initialize reports version 2.0.1", async (ctx) => {
      assertEqual(ctx.client.serverInfo.name, "v0-mcp-server", "serverInfo names the server");
      assertEqual(ctx.client.serverInfo.version, "2.0.1", "serverInfo.version is read from package.json (2.0.1), not the hardcoded 1.0.0");
    }),
    step("no entry point hardcodes '1.0.0'", async (ctx) => {
      const files = ["src/config.ts", "src/server.ts", "src/start.ts", "src/cli/index.ts"];
      for (const f of files) {
        const source = fs.readFileSync(path.join(ctx.projectRoot, f), "utf-8");
        assertTrue(!source.includes("'1.0.0'") && !source.includes('"1.0.0"'), `${f} no longer hardcodes '1.0.0'`);
      }
    }),
  ],
};
