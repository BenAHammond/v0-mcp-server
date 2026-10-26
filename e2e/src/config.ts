import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

export interface Config {
  /** Absolute path to the built library (`v0-mcp-server/dist/index.js`). */
  libPath: string;
  /** The project root (`v0-mcp-server/`) the server process runs from. */
  projectRoot: string;
  /** A valid-format v0 API key. */
  apiKey: string;
}

const here = path.dirname(fileURLToPath(import.meta.url)); // e2e/dist (compiled)
const projectRoot = path.resolve(here, "..", ".."); // e2e/dist -> e2e -> v0-mcp-server

/**
 * Load the harness configuration. Both fields default sensibly so a bare run works
 * against the freshly built library with no flags.
 *
 * @param env - the environment to read from (defaults to `process.env`).
 * @returns the resolved harness configuration.
 */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const libPath = path.resolve(env.V0_LIB_PATH ?? path.join(projectRoot, "dist", "index.js"));
  if (!fs.existsSync(libPath)) {
    throw new Error(`${libPath} missing — run \`pnpm build\` in the project root first`);
  }
  const apiKey = (env.V0_API_KEY ?? "").trim() || "v0_test_key_123456789012345";
  return { libPath, projectRoot, apiKey };
}
