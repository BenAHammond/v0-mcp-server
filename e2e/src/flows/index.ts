import type { Flow } from "../flow.js";
import { serverSurface } from "./server-surface.js";
import { sdkDiscoveryRemoved } from "./sdk-discovery.js";
import { networkFreeToolCall, unknownToolRefusal, missingParamRefusal } from "./tool-call.js";

/** The acceptance suite, in run order. */
export const flows: Flow[] = [
  serverSurface,
  sdkDiscoveryRemoved,
  networkFreeToolCall,
  unknownToolRefusal,
  missingParamRefusal,
];
