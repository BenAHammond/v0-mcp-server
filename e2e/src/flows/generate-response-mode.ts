import * as fs from "node:fs";
import * as path from "node:path";
import type { Flow } from "../flow.js";
import { step } from "../flow.js";
import { assertEqual, assertTrue } from "../assert.js";

/**
 * The card's criterion: `generate` declares a `responseMode` parameter accepting
 * `sync`, `async`, or `experimental_stream`, and its sdkFunction forwards it to
 * both `chats.create` and `chats.sendMessage`.
 *
 * The declaration half is checked against the live schema (`tools/list`), which is
 * where the enum is surfaced. The forwarding half is a source-tree property — the
 * value must sit in the `shared` payload that both the create and sendMessage paths
 * receive — so it is read from `src/tools/v0-tools.ts`, not the built bundle.
 */
export const generateExposesResponseMode: Flow = {
  name: "generate-exposes-response-mode",
  description: "generate declares a responseMode parameter (enum sync/async/experimental_stream) and forwards it to both chats.create and chats.sendMessage.",
  steps: [
    step("generate's schema declares responseMode with the three-value enum", async (ctx) => {
      const tools = await ctx.client.listTools();
      const generate = tools.find((t) => t.name === "generate");
      assertTrue(generate !== undefined, "generate is a registered tool");

      const schema = (generate as any).inputSchema ?? {};
      const responseMode = schema.properties?.responseMode;
      assertTrue(responseMode !== undefined, "generate declares a responseMode parameter");
      assertEqual(responseMode.type, "string", "responseMode is a string parameter");
      assertEqual(
        JSON.stringify(responseMode.enum),
        JSON.stringify(["sync", "async", "experimental_stream"]),
        "responseMode enumerates sync, async, and experimental_stream",
      );
    }),
    step("generate's sdkFunction forwards responseMode to both create and sendMessage", async (ctx) => {
      const sourcePath = path.join(ctx.projectRoot, "src", "tools", "v0-tools.ts");
      const source = fs.readFileSync(sourcePath, "utf8");

      // The value is extracted from params and placed in the `shared` payload.
      assertTrue(
        source.includes("const responseMode = typeof params?.responseMode"),
        "responseMode is extracted from the tool params",
      );
      const sharedBlock = source.match(/const shared = compact\(\{[\s\S]*?\}\);/);
      assertTrue(sharedBlock !== null, "generate builds a shared payload");
      assertTrue(sharedBlock![0].includes("responseMode"), "the shared payload carries responseMode");

      // Both the continue (sendMessage) and create paths receive `shared`.
      assertTrue(source.includes("continueChat(client, chatId, shared)"), "the sendMessage path receives shared");
      assertTrue(source.includes("...shared"), "the create path receives shared");
    }),
  ],
};
