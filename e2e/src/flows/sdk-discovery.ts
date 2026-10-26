import * as fs from "node:fs";
import * as path from "node:path";
import type { Flow } from "../flow.js";
import { step } from "../flow.js";
import { assertTrue } from "../assert.js";

export const sdkDiscoveryRemoved: Flow = {
  name: "sdk-discovery-removed",
  description: "the dead runtime-introspection module (src/utils/sdk-discovery.ts) is deleted from the repository.",
  steps: [
    step("src/utils/sdk-discovery.ts does not exist", async (ctx) => {
      // A source-tree criterion ("deleted from the repository") is checked against
      // the source tree, not the built bundle — the bundle never names a deleted
      // file. This is an acceptance check of a deletion, not a unit test of src.
      const discoveryPath = path.join(ctx.projectRoot, "src", "utils", "sdk-discovery.ts");
      assertTrue(!fs.existsSync(discoveryPath), `runtime-introspection module is removed (${discoveryPath} must not exist)`);
    }),
  ],
};
