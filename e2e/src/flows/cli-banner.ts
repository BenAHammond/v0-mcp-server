import * as fs from "node:fs";
import * as path from "node:path";
import type { Flow } from "../flow.js";
import { step } from "../flow.js";
import { assertTrue } from "../assert.js";

/**
 * The `cli-banner-writes-to-stdout` criteria: the startup banner, startup status,
 * and shutdown status all write to stderr (console.error), leaving stdout
 * exclusively for the MCP stdio protocol. Checked in source: the banner's first
 * line and the "starting server" line are `console.error`, and their old
 * `console.log` forms are gone.
 */
export const cliBannerToStderr: Flow = {
  name: "cli-banner-to-stderr",
  description: "the CLI startup banner and status write to stderr, not stdout.",
  steps: [
    step("the startup banner writes to stderr", async (ctx) => {
      const source = fs.readFileSync(path.join(ctx.projectRoot, "src", "cli", "index.ts"), "utf-8");
      assertTrue(source.includes("console.error(chalk.cyan('┌"), "the banner's first line is console.error");
      assertTrue(!source.includes("console.log(chalk.cyan('┌"), "the banner no longer writes to stdout");
    }),
    step("the startup and shutdown status write to stderr", async (ctx) => {
      const source = fs.readFileSync(path.join(ctx.projectRoot, "src", "cli", "index.ts"), "utf-8");
      assertTrue(source.includes("console.error(chalk.blue('🚀 Starting Simplified v0 MCP Server...'))"), "the 'starting server' status is console.error");
      assertTrue(!source.includes("console.log(chalk.blue('🚀 Starting"), "the 'starting server' status no longer writes to stdout");
      assertTrue(source.includes("console.error(chalk.green('✅ Simplified v0 MCP Server started successfully!'))"), "the 'server started' status is console.error");
      assertTrue(source.includes("console.error(chalk.yellow(`\\n🛑 Received ${signal} signal"), "the shutdown status is console.error");
    }),
  ],
};
